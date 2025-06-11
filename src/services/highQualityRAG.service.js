import OpenAI from 'openai';
import { create, insert, search, save, load } from '@orama/orama';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ConfigService } from './config.service';

export class HighQualityRAGService {
  constructor() {
    this.openai = null;
    this.db = null;
    this.initialized = false;
    this.pdfWorker = null;
    
    // Configurações otimizadas para qualidade máxima
    this.config = {
      embeddingModel: 'text-embedding-3-large',
      embeddingDimensions: 3072,
      chatModel: 'gpt-4o-mini', // Updated to current available model
      chunkSize: 800,
      chunkOverlap: 200,
      temperature: 0.2,
      maxTokens: 4000,
      topK: 10,
      similarityThreshold: 0.7,
      batchSize: 5,
      maxRetries: 3,
      retryDelay: 1000
    };

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      separators: ["\n\n", "\n", ". ", "! ", "? ", "; ", ": ", " ", ""]
    });
    
    // Cache de embeddings para evitar reprocessamento
    this.embeddingCache = new Map();
  }

  async initialize() {
    const apiKey = ConfigService.getApiKey();
    if (!apiKey) {
      throw new Error('API key não configurada');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    // Criar banco vetorial otimizado
    this.db = await create({
      schema: {
        id: 'string',
        text: 'string',
        embedding: `vector[${this.config.embeddingDimensions}]`,
        pageNumber: 'number',
        source: 'string', 
        chunkIndex: 'number',
        totalTokens: 'number',
        importance: 'number',
        hash: 'string'
      }
    });

    // Inicializar Web Worker
    this.pdfWorker = new Worker(new URL('../workers/pdf.worker.js', import.meta.url), {
      type: 'module'
    });

    this.initialized = true;
  }

  // Processar PDF com Web Worker
  async processPDF(file, onProgress) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      const arrayBuffer = await file.arrayBuffer();
      const allChunks = [];
      let processedPages = 0;

      // Listener para mensagens do worker
      const handleWorkerMessage = async (event) => {
        const { type, data, error } = event.data;

        if (type === 'batch-complete') {
          processedPages += data.chunks.length;
          
          // Processar chunks do batch
          for (const pageData of data.chunks) {
            const chunks = await this.splitter.splitText(pageData.text);
            
            chunks.forEach((chunk, index) => {
              const hash = this.generateHash(chunk);
              
              allChunks.push({
                text: chunk,
                metadata: {
                  pageNumber: pageData.pageNumber,
                  chunkIndex: index,
                  source: file.name,
                  totalTokens: this.estimateTokens(chunk),
                  importance: this.calculateImportance(chunk, pageData.pageNumber, 100), // Assumindo 100 páginas max
                  hash: hash
                }
              });
            });
          }

          onProgress?.({
            phase: 'extraction',
            current: data.progress.current,
            total: data.progress.total,
            percentage: data.progress.percentage * 0.4, // 40% para extração
            message: `Extraindo texto: ${data.progress.current}/${data.progress.total} páginas`
          });
        } 
        else if (type === 'processing-complete') {
          // Iniciar fase de embeddings
          this.pdfWorker.removeEventListener('message', handleWorkerMessage);
          
          try {
            await this.generateAndStoreEmbeddings(allChunks, file.name, onProgress);
            
            const processingTime = Date.now() - startTime;
            const result = {
              success: true,
              documentName: file.name,
              totalPages: processedPages,
              totalChunks: allChunks.length,
              processingTime: processingTime,
              estimatedCost: this.estimateCost(allChunks.length)
            };
            
            resolve(result);
          } catch (err) {
            reject(err);
          }
        }
        else if (type === 'error') {
          this.pdfWorker.removeEventListener('message', handleWorkerMessage);
          reject(new Error(error));
        }
      };

      this.pdfWorker.addEventListener('message', handleWorkerMessage);
      
      // Iniciar processamento
      this.pdfWorker.postMessage({
        type: 'process-pdf',
        data: { arrayBuffer, chunkSize: this.config.chunkSize }
      });
    });
  }

  // Gerar e armazenar embeddings com retry e cache
  async generateAndStoreEmbeddings(chunks, sourceName, onProgress) {
    const totalChunks = chunks.length;
    let processedChunks = 0;
    
    // Processar em batches
    for (let i = 0; i < totalChunks; i += this.config.batchSize) {
      const batch = chunks.slice(i, i + this.config.batchSize);
      
      // Verificar cache primeiro
      const embeddings = await Promise.all(
        batch.map(async (chunk) => {
          if (this.embeddingCache.has(chunk.metadata.hash)) {
            return this.embeddingCache.get(chunk.metadata.hash);
          }
          
          // Gerar com retry
          const embedding = await this.generateEmbeddingWithRetry(chunk.text);
          this.embeddingCache.set(chunk.metadata.hash, embedding);
          return embedding;
        })
      );
      
      // Inserir no banco vetorial
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddings[j];
        
        await insert(this.db, {
          id: `${sourceName}_p${chunk.metadata.pageNumber}_c${chunk.metadata.chunkIndex}`,
          text: chunk.text,
          embedding: embedding,
          pageNumber: chunk.metadata.pageNumber,
          source: chunk.metadata.source,
          chunkIndex: chunk.metadata.chunkIndex,
          totalTokens: chunk.metadata.totalTokens,
          importance: chunk.metadata.importance,
          hash: chunk.metadata.hash
        });
      }
      
      processedChunks += batch.length;
      
      onProgress?.({
        phase: 'embedding',
        current: processedChunks,
        total: totalChunks,
        percentage: 40 + (processedChunks / totalChunks) * 60, // 40-100%
        message: `Gerando embeddings: ${processedChunks}/${totalChunks} chunks`
      });
      
      // Rate limiting
      if (i + this.config.batchSize < totalChunks) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  // Gerar embedding com retry automático
  async generateEmbeddingWithRetry(text, retries = 0) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.embeddingModel,
        input: text,
        dimensions: this.config.embeddingDimensions
      });
      
      return response.data[0].embedding;
    } catch (error) {
      if (retries < this.config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retries + 1)));
        return this.generateEmbeddingWithRetry(text, retries + 1);
      }
      throw error;
    }
  }

  // Busca semântica otimizada
  async searchSemantic(query, options = {}) {
    if (!this.initialized || !this.db) {
      throw new Error('Sistema não inicializado');
    }

    const {
      limit = this.config.topK,
      threshold = this.config.similarityThreshold,
      useReranking = true,
      includeContext = true
    } = options;

    // Gerar embedding da query com cache
    const queryHash = this.generateHash(query);
    let queryEmbedding;
    
    if (this.embeddingCache.has(queryHash)) {
      queryEmbedding = this.embeddingCache.get(queryHash);
    } else {
      queryEmbedding = await this.generateEmbeddingWithRetry(query);
      this.embeddingCache.set(queryHash, queryEmbedding);
    }

    // Busca vetorial
    const results = await search(this.db, {
      mode: 'vector',
      vector: {
        value: queryEmbedding,
        property: 'embedding'
      },
      limit: limit * 2,
      threshold: threshold,
      includeVectors: false
    });

    let relevantDocs = results.hits.map(hit => ({
      text: hit.document.text,
      score: hit.score,
      metadata: {
        pageNumber: hit.document.pageNumber,
        source: hit.document.source,
        chunkIndex: hit.document.chunkIndex,
        totalTokens: hit.document.totalTokens,
        importance: hit.document.importance,
        hash: hit.document.hash
      }
    }));

    // Reranking com GPT
    if (useReranking && relevantDocs.length > 0) {
      relevantDocs = await this.rerankDocuments(query, relevantDocs, limit);
    }

    // Incluir contexto adjacente se solicitado
    if (includeContext) {
      relevantDocs = await this.expandWithContext(relevantDocs);
    }

    return relevantDocs.slice(0, limit);
  }

  // Expandir com chunks adjacentes para mais contexto
  async expandWithContext(documents) {
    const expanded = [];
    
    for (const doc of documents) {
      expanded.push(doc);
      
      // Buscar chunks adjacentes
      const prevChunkId = `${doc.metadata.source}_p${doc.metadata.pageNumber}_c${doc.metadata.chunkIndex - 1}`;
      const nextChunkId = `${doc.metadata.source}_p${doc.metadata.pageNumber}_c${doc.metadata.chunkIndex + 1}`;
      
      // Adicionar contexto anterior/posterior se existir
      // (implementação simplificada - em produção, fazer query no DB)
    }
    
    return expanded;
  }

  // Gerar resposta com streaming
  async generateResponse(query, options = {}) {
    const {
      systemPrompt = `Você é um assistente especializado que fornece respostas precisas e detalhadas baseadas no contexto fornecido. 
      Sempre cite as páginas relevantes quando possível e seja específico nas suas respostas.
      Se não encontrar informação suficiente no contexto, diga claramente.`,
      includePageNumbers = true,
      streamResponse = true,
      maxContextTokens = 12000
    } = options;

    // Buscar documentos relevantes
    const relevantDocs = await this.searchSemantic(query, {
      useReranking: true,
      includeContext: true
    });
    
    if (relevantDocs.length === 0) {
      return {
        answer: 'Desculpe, não encontrei informações relevantes no documento para responder sua pergunta.',
        sources: [],
        cached: false
      };
    }

    // Verificar cache de respostas
    const cacheKey = `${query}_${relevantDocs.map(d => d.metadata.hash).join('_')}`;
    const cachedResponse = this.getResponseCache(cacheKey);
    if (cachedResponse) {
      return { ...cachedResponse, cached: true };
    }

    // Construir contexto otimizado
    const context = this.buildOptimizedContext(relevantDocs, maxContextTokens);

    // Preparar mensagens
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Contexto do documento:\n\n${context}\n\nPergunta: ${query}\n\nPor favor, forneça uma resposta detalhada e precisa baseada no contexto acima.`
      }
    ];

    try {
      if (streamResponse) {
        const stream = await this.openai.chat.completions.create({
          model: this.config.chatModel,
          messages: messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: true
        });

        return {
          stream: stream,
          sources: relevantDocs.map(doc => doc.metadata),
          cached: false
        };
      } else {
        const response = await this.openai.chat.completions.create({
          model: this.config.chatModel,
          messages: messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        });

        const result = {
          answer: response.choices[0].message.content,
          sources: relevantDocs.map(doc => doc.metadata),
          usage: response.usage,
          cached: false
        };

        // Cachear resposta
        this.setResponseCache(cacheKey, result);

        return result;
      }
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      throw new Error('Falha ao gerar resposta: ' + error.message);
    }
  }

  // Sistema de cache de respostas
  responseCache = new Map();
  
  getResponseCache(key) {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hora
      return cached.data;
    }
    return null;
  }
  
  setResponseCache(key, data) {
    this.responseCache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    // Limpar cache antigo
    if (this.responseCache.size > 100) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
  }

  // Reranking melhorado
  async rerankDocuments(query, documents, topK) {
    const prompt = `Task: Rank these text passages by relevance to the query.
    
Query: "${query}"
    
Passages:
${documents.map((doc, i) => `[${i + 1}] ${doc.text.substring(0, 300)}...`).join('\n\n')}
    
Return ONLY the passage numbers in order of relevance (most to least relevant), separated by commas.
Example: 3,1,5,2,4`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 50
      });

      const content = response.choices[0].message.content.trim();
      const ranking = content.split(',')
        .map(n => parseInt(n.trim()) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < documents.length);

      if (ranking.length === 0) {
        return documents;
      }

      return ranking.map(index => documents[index]);
    } catch (error) {
      console.warn('Reranking falhou:', error);
      return documents;
    }
  }

  // Construir contexto otimizado com metadados
  buildOptimizedContext(documents, maxTokens) {
    let context = '';
    let currentTokens = 0;

    // Ordenar por score * importance
    const sorted = documents.sort((a, b) => 
      (b.score * b.metadata.importance) - (a.score * a.metadata.importance)
    );

    for (const doc of sorted) {
      const docTokens = doc.metadata.totalTokens;
      
      if (currentTokens + docTokens > maxTokens) {
        break;
      }

      const pageInfo = ` [Página ${doc.metadata.pageNumber}]`;
      const relevanceInfo = ` [Relevância: ${(doc.score * 100).toFixed(1)}%]`;
      
      context += `${doc.text}${pageInfo}${relevanceInfo}\n\n---\n\n`;
      currentTokens += docTokens;
    }

    return context.trim();
  }

  // Exportar índice completo com metadados
  async exportIndex() {
    const indexData = await save(this.db);
    const stats = await this.analyzeDocument();
    
    const exportData = {
      version: '2.0',
      metadata: {
        model: this.config.embeddingModel,
        dimensions: this.config.embeddingDimensions,
        created: new Date().toISOString(),
        stats: stats,
        config: this.config
      },
      index: indexData,
      embeddingCache: Array.from(this.embeddingCache.entries()).slice(0, 100) // Limitar tamanho
    };

    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
    return blob;
  }

  // Importar índice com validação
  async importIndex(file) {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validações
    if (!data.version || data.version !== '2.0') {
      throw new Error('Versão de índice incompatível');
    }

    if (data.metadata?.dimensions !== this.config.embeddingDimensions) {
      throw new Error(`Índice usa ${data.metadata.dimensions} dimensões, mas o sistema está configurado para ${this.config.embeddingDimensions}`);
    }

    // Carregar índice
    this.db = await load(data.index);
    
    // Restaurar cache de embeddings
    if (data.embeddingCache) {
      this.embeddingCache = new Map(data.embeddingCache);
    }

    this.initialized = true;

    return data.metadata;
  }

  // Análise detalhada do documento
  async analyzeDocument() {
    if (!this.db) return null;

    try {
      const allDocs = await search(this.db, {
        term: '*',
        limit: 10000
      });

      const stats = {
        totalChunks: allDocs.hits.length,
        totalTokens: 0,
        averageChunkSize: 0,
        pagesProcessed: new Set(),
        tokenDistribution: [],
        importanceDistribution: [],
        uniqueHashes: new Set()
      };

      allDocs.hits.forEach(hit => {
        const doc = hit.document;
        stats.totalTokens += doc.totalTokens || 0;
        stats.pagesProcessed.add(doc.pageNumber);
        stats.tokenDistribution.push(doc.totalTokens || 0);
        stats.importanceDistribution.push(doc.importance || 1);
        stats.uniqueHashes.add(doc.hash);
      });

      stats.averageChunkSize = stats.totalChunks > 0 ? Math.round(stats.totalTokens / stats.totalChunks) : 0;
      stats.pagesProcessed = stats.pagesProcessed.size;
      stats.duplicateChunks = stats.totalChunks - stats.uniqueHashes.size;

      // Calcular percentis
      stats.tokenPercentiles = this.calculatePercentiles(stats.tokenDistribution);
      stats.importancePercentiles = this.calculatePercentiles(stats.importanceDistribution);

      return stats;
    } catch (error) {
      console.error('Error analyzing document:', error);
      return null;
    }
  }

  // Utilitários
  estimateTokens(text) {
    // Aproximação: ~3 caracteres por token em português
    return Math.ceil(text.length / 3);
  }

  generateHash(text) {
    // Hash simples para cache
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  calculateImportance(text, pageNum, totalPages) {
    let score = 1.0;
    
    // Primeiras páginas (resumo, introdução)
    if (pageNum <= 3) score *= 1.3;
    
    // Últimas páginas (conclusão)
    if (pageNum >= totalPages - 2) score *= 1.2;
    
    // Títulos e subtítulos (heurística)
    if (text.match(/^[A-Z\s\d\.]{3,50}$/m)) score *= 1.4;
    
    // Parágrafos com números e dados
    const numbers = text.match(/\d+\.?\d*/g) || [];
    if (numbers.length > 5) score *= 1.2;
    
    // Listas e enumerações
    if (text.match(/^\s*[\d\-\*•]\s+/m)) score *= 1.1;
    
    // Chunks mais longos (mais contexto)
    if (text.length > 600) score *= 1.1;
    
    return Math.min(score, 2.0);
  }

  calculatePercentiles(values) {
    if (!values.length) return {};
    
    const sorted = values.sort((a, b) => a - b);
    const percentiles = {};
    
    [25, 50, 75, 90, 95].forEach(p => {
      const index = Math.floor((p / 100) * sorted.length);
      percentiles[`p${p}`] = sorted[index];
    });
    
    return percentiles;
  }

  estimateCost(totalChunks) {
    const tokensPerChunk = this.config.chunkSize;
    const totalTokens = totalChunks * tokensPerChunk;
    
    return {
      embedding: {
        model: this.config.embeddingModel,
        tokens: totalTokens,
        cost: (totalTokens / 1000) * 0.00013 // $0.00013 per 1K tokens
      },
      total: (totalTokens / 1000) * 0.00013
    };
  }

  // Limpar recursos
  cleanup() {
    if (this.pdfWorker) {
      this.pdfWorker.terminate();
      this.pdfWorker = null;
    }
    this.embeddingCache.clear();
    this.responseCache.clear();
  }
}