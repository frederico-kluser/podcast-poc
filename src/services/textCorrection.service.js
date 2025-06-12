import OpenAI from 'openai';
import { ConfigService } from './config.service';
import { createCorrectionMetrics } from '../utils/correctionMetrics';
import { OpenAIParallelService } from './openaiParallel.service';

export class TextCorrectionService {
  static openai = null;
  static model = 'gpt-4o-mini';
  static temperature = 0.0;
  static maxRetries = 3;
  static retryDelay = 1000;
  static correctionCache = new Map();
  static maxCacheSize = 1000;
  static metrics = createCorrectionMetrics();
  static parallelConfig = {
    concurrency: 8,
    maxRequestsPerMinute: 3500,
    enableAdaptiveConcurrency: true
  };

  static async initialize() {
    const apiKey = ConfigService.getApiKey();
    if (!apiKey) {
      throw new Error('API key não configurada');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  static async correctSpacing(text, options = {}) {
    if (!this.openai) {
      await this.initialize();
    }

    // Check cache first
    const textHash = this.generateHash(text);
    if (this.correctionCache.has(textHash)) {
      console.log('✅ Correção encontrada no cache');
      return this.correctionCache.get(textHash);
    }

    const startTime = Date.now();

    const systemPrompt = `<role>
You are an AI text correction assistant specialized in fixing spacing issues in Portuguese text extracted from PDFs.
</role>

<task>
Your task is to correct spacing problems in the provided text, ensuring proper word separation and readability.
</task>

<instructions>
1. Add spaces between words that are incorrectly joined
2. Fix any spacing issues that affect readability
3. Preserve the original meaning and context
4. Maintain technical terms, URLs, emails, and numbers as they appear
5. Keep paragraph structure and line breaks
6. Return ONLY the corrected text without any introduction, explanation, or additional commentary
</instructions>

<output_format>
Provide ONLY the corrected text. Do not include:
- Introductory phrases like "Here is the corrected text:"
- Explanations of what was changed
- Any metadata or disclaimers
- Closing remarks

Just return the clean, corrected text.
</output_format>

<examples>
<example>
<input>Esteéumtextocomespaçosfaltando</input>
<output>Este é um texto com espaços faltando</output>
</example>

<example>
<input>Apáginacontém3exemplosdiferentes</input>
<output>A página contém 3 exemplos diferentes</output>
</example>
</examples>`;

    const userPrompt = `<text_to_correct>
${text}
</text_to_correct>`;

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: this.temperature,
          max_tokens: Math.ceil(text.length * 1.5),
          top_p: 1.0,
          frequency_penalty: 0,
          presence_penalty: 0
        });
      });

      const correctedText = response.choices[0].message.content.trim();

      // Add to cache
      this.addToCache(textHash, correctedText);

      // Track metrics
      const processingTime = Date.now() - startTime;
      this.metrics.track(text, correctedText, processingTime);

      console.log(`✅ Texto corrigido em ${processingTime}ms`);
      return correctedText;
    } catch (error) {
      console.error('Erro na correção de texto:', error);
      
      // Track error in metrics
      const processingTime = Date.now() - startTime;
      this.metrics.track(text, text, processingTime, error.message);
      
      throw error;
    }
  }

  static async correctInBatches(chunks, onProgress) {
    // Use the new parallel processing service for optimal performance
    console.log(`🚀 Iniciando correção paralela de ${chunks.length} chunks`);
    
    const startTime = Date.now();
    const texts = chunks.map(chunk => chunk.text);
    
    // Process all texts in parallel with optimal concurrency
    const results = await OpenAIParallelService.correctTextsInParallel(texts, {
      concurrency: this.parallelConfig.concurrency,
      maxRequestsPerMinute: this.parallelConfig.maxRequestsPerMinute,
      enableAdaptiveConcurrency: this.parallelConfig.enableAdaptiveConcurrency,
      model: this.model,
      temperature: this.temperature,
      onProgress: (progress) => {
        if (onProgress) {
          onProgress({
            current: progress.completed + progress.failed,
            total: progress.total,
            percentage: parseFloat(progress.percentage),
            inFlight: progress.inFlight,
            elapsedTime: progress.elapsedTime
          });
        }
      },
      onRequestComplete: ({ index, completed, total }) => {
        console.log(`✅ Chunk ${index + 1}/${total} corrigido`);
      },
      onRequestError: ({ index, error, failed, total }) => {
        console.error(`❌ Erro no chunk ${index + 1}: ${error}`);
      }
    });

    // Map results back to chunks format
    const correctedChunks = chunks.map((chunk, index) => {
      const result = results[index];
      
      if (result.success) {
        // Add to cache
        const textHash = this.generateHash(chunk.text);
        this.addToCache(textHash, result.text);
        
        // Track metrics
        const processingTime = (Date.now() - startTime) / chunks.length;
        this.metrics.track(chunk.text, result.text, processingTime);
        
        return { ...chunk, text: result.text };
      } else {
        // Track error in metrics
        const processingTime = (Date.now() - startTime) / chunks.length;
        this.metrics.track(chunk.text, chunk.text, processingTime, result.error);
        
        return { ...chunk, text: chunk.text, error: result.error };
      }
    });

    const totalTime = Date.now() - startTime;
    console.log(`\n🎉 Correção paralela concluída em ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`⚡ Velocidade média: ${(chunks.length / (totalTime / 1000)).toFixed(2)} chunks/s`);

    return correctedChunks;
  }

  // Legacy method for backward compatibility - now uses parallel processing internally
  static async correctInBatchesSequential(chunks, onProgress) {
    const results = [];
    const batchSize = 5;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      const batchPromises = batch.map(chunk => 
        this.correctSpacing(chunk.text)
          .then(corrected => ({ ...chunk, text: corrected }))
          .catch(error => ({ ...chunk, text: chunk.text, error }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (onProgress) {
        onProgress({
          current: Math.min(i + batchSize, chunks.length),
          total: chunks.length,
          percentage: Math.min(((i + batchSize) / chunks.length) * 100, 100)
        });
      }

      // Rate limiting between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  static async retryWithBackoff(fn, retries = 0) {
    try {
      return await fn();
    } catch (error) {
      if (retries < this.maxRetries && error.status === 429) {
        const delay = this.retryDelay * Math.pow(2, retries) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, retries + 1);
      }
      throw error;
    }
  }

  static generateHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  static addToCache(hash, correctedText) {
    if (this.correctionCache.size >= this.maxCacheSize) {
      const firstKey = this.correctionCache.keys().next().value;
      this.correctionCache.delete(firstKey);
    }
    this.correctionCache.set(hash, correctedText);
  }

  static estimateCost(textLength, chunks) {
    const estimatedInputTokens = Math.ceil(textLength / 3);
    const estimatedOutputTokens = estimatedInputTokens * 1.1;
    
    const inputCost = (estimatedInputTokens / 1_000_000) * 0.15;
    const outputCost = (estimatedOutputTokens / 1_000_000) * 0.60;
    
    return {
      estimatedInputTokens,
      estimatedOutputTokens,
      totalCost: inputCost + outputCost,
      costPerChunk: (inputCost + outputCost) / chunks
    };
  }

  static getMetricsSummary() {
    return this.metrics.getSummary();
  }

  static exportMetrics() {
    return this.metrics.exportMetrics();
  }

  static resetMetrics() {
    this.metrics.reset();
  }

  static configureParallelProcessing(config) {
    this.parallelConfig = {
      ...this.parallelConfig,
      ...config
    };
    console.log('📋 Configuração de processamento paralelo atualizada:', this.parallelConfig);
  }

  static getParallelConfig() {
    return { ...this.parallelConfig };
  }

  static async estimateParallelProcessingTime(chunks) {
    const avgProcessingTime = 2000; // 2 seconds average per request
    const concurrency = this.parallelConfig.concurrency;
    const batches = Math.ceil(chunks.length / concurrency);
    const estimatedTime = batches * avgProcessingTime;
    
    return {
      totalChunks: chunks.length,
      concurrency,
      estimatedBatches: batches,
      estimatedTimeMs: estimatedTime,
      estimatedTimeSeconds: estimatedTime / 1000,
      estimatedTimeMinutes: estimatedTime / 60000
    };
  }
}

export const createTextCorrectionService = () => {
  return TextCorrectionService;
};