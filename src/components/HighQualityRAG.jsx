import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Textarea,
  Progress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  List,
  ListItem,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Tooltip,
} from '@material-tailwind/react';
import {
  DocumentIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  FolderIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { HighQualityRAGService } from '../services/highQualityRAG.service';
import { ConfigService } from '../services/config.service';

export function HighQualityRAG() {
  const [ragService] = useState(() => new HighQualityRAGService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [savedIndexes, setSavedIndexes] = useState([]);
  const [showSavedIndexes, setShowSavedIndexes] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const fileInputRef = useRef(null);
  const indexInputRef = useRef(null);

  // Inicializar serviço
  useEffect(() => {
    const init = async () => {
      try {
        await ragService.initialize();
        setIsInitialized(true);
        
        // Carregar histórico de queries
        const history = JSON.parse(localStorage.getItem('query_history') || '[]');
        setQueryHistory(history);
      } catch (err) {
        setError(err.message);
      }
    };
    
    if (ConfigService.hasApiKey()) {
      init();
    }
  }, [ragService]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      ragService.cleanup();
    };
  }, [ragService]);

  // Processar PDF
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 100MB');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setError(null);
    setProgress(null);
    setResponse(null);

    try {
      const result = await ragService.processPDF(file, (prog) => {
        setProgress(prog);
      });

      // Obter estatísticas
      const docStats = await ragService.analyzeDocument();
      setStats(docStats);

      // Salvar metadados
      const metadata = {
        fileName: file.name,
        processedAt: new Date().toISOString(),
        stats: docStats,
        result: result
      };
      
      ConfigService.saveIndexMetadata(metadata);

      setProgress(null);
      
      // Notificação de sucesso
      const notification = `✅ PDF processado com sucesso!\n\n` +
        `📄 ${result.totalPages} páginas\n` +
        `📦 ${result.totalChunks} chunks\n` +
        `⏱️ ${(result.processingTime / 1000).toFixed(1)}s\n` +
        `💰 Custo estimado: $${result.estimatedCost.total.toFixed(4)}`;
      
      alert(notification);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [ragService]);

  // Fazer pergunta
  const handleQuery = useCallback(async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResponse(null);
    setIsStreaming(true);

    try {
      const startTime = Date.now();
      const result = await ragService.generateResponse(query, {
        streamResponse: true
      });

      // Processar stream
      let fullResponse = '';
      setResponse({ 
        answer: '', 
        sources: result.sources, 
        isStreaming: true,
        startTime: startTime 
      });

      for await (const chunk of result.stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        
        setResponse(prev => ({
          ...prev,
          answer: fullResponse
        }));
      }

      const endTime = Date.now();
      const responseTime = (endTime - startTime) / 1000;

      setResponse(prev => ({
        ...prev,
        isStreaming: false,
        responseTime: responseTime,
        cached: result.cached || false
      }));

      // Adicionar ao histórico
      const historyItem = {
        query: query,
        answer: fullResponse.substring(0, 100) + '...',
        timestamp: new Date().toISOString(),
        sources: result.sources.length
      };
      
      const newHistory = [historyItem, ...queryHistory].slice(0, 20);
      setQueryHistory(newHistory);
      localStorage.setItem('query_history', JSON.stringify(newHistory));

    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setIsStreaming(false);
    }
  }, [query, ragService, queryHistory]);

  // Exportar índice
  const handleExport = useCallback(async () => {
    try {
      const blob = await ragService.exportIndex();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rag-index-${uploadedFile?.name || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Notificar sucesso
      alert('✅ Índice exportado com sucesso!');
    } catch (err) {
      setError(err.message);
    }
  }, [ragService, uploadedFile]);

  // Importar índice
  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const metadata = await ragService.importIndex(file);
      setStats(metadata.stats);
      setUploadedFile({ name: metadata.stats?.documentName || 'Documento importado' });
      
      alert(`✅ Índice importado com sucesso!\n\n` +
        `📄 Documento: ${metadata.stats?.documentName || 'Desconhecido'}\n` +
        `📦 ${metadata.stats?.totalChunks || 0} chunks\n` +
        `📅 Criado em: ${new Date(metadata.created).toLocaleDateString()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [ragService]);

  // Carregar query do histórico
  const loadFromHistory = (item) => {
    setQuery(item.query);
  };

  // Limpar tudo
  const handleReset = () => {
    if (confirm('Deseja limpar todos os dados e começar novamente?')) {
      ragService.cleanup();
      setUploadedFile(null);
      setStats(null);
      setResponse(null);
      setQuery('');
      setError(null);
      window.location.reload();
    }
  };

  // UI de estatísticas
  const StatsDialog = () => (
    <Dialog open={showStats} handler={() => setShowStats(false)} size="xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6" />
          Estatísticas do Documento
        </div>
      </DialogHeader>
      <DialogBody className="overflow-y-auto max-h-[70vh]">
        {stats && (
          <div className="space-y-6">
            {/* Cards de estatísticas principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50">
                <CardBody className="text-center">
                  <Typography variant="h6" color="blue">Total de Chunks</Typography>
                  <Typography variant="h3" color="blue-gray">
                    {stats.totalChunks}
                  </Typography>
                </CardBody>
              </Card>
              
              <Card className="bg-green-50">
                <CardBody className="text-center">
                  <Typography variant="h6" color="green">Total de Tokens</Typography>
                  <Typography variant="h3" color="blue-gray">
                    {(stats.totalTokens / 1000).toFixed(1)}k
                  </Typography>
                </CardBody>
              </Card>
              
              <Card className="bg-orange-50">
                <CardBody className="text-center">
                  <Typography variant="h6" color="orange">Páginas</Typography>
                  <Typography variant="h3" color="blue-gray">
                    {stats.pagesProcessed}
                  </Typography>
                </CardBody>
              </Card>
              
              <Card className="bg-purple-50">
                <CardBody className="text-center">
                  <Typography variant="h6" color="purple">Média/Chunk</Typography>
                  <Typography variant="h3" color="blue-gray">
                    {stats.averageChunkSize}
                  </Typography>
                </CardBody>
              </Card>
            </div>

            {/* Distribuição de tokens */}
            {stats.tokenPercentiles && (
              <Card>
                <CardBody>
                  <Typography variant="h6" className="mb-3">
                    Distribuição de Tokens por Chunk
                  </Typography>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Typography variant="small">Percentil 25:</Typography>
                      <Typography variant="small" className="font-medium">
                        {stats.tokenPercentiles.p25} tokens
                      </Typography>
                    </div>
                    <div className="flex justify-between">
                      <Typography variant="small">Mediana (P50):</Typography>
                      <Typography variant="small" className="font-medium">
                        {stats.tokenPercentiles.p50} tokens
                      </Typography>
                    </div>
                    <div className="flex justify-between">
                      <Typography variant="small">Percentil 75:</Typography>
                      <Typography variant="small" className="font-medium">
                        {stats.tokenPercentiles.p75} tokens
                      </Typography>
                    </div>
                    <div className="flex justify-between">
                      <Typography variant="small">Percentil 95:</Typography>
                      <Typography variant="small" className="font-medium">
                        {stats.tokenPercentiles.p95} tokens
                      </Typography>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Estimativa de custos detalhada */}
            <Card className="bg-blue-gray-50">
              <CardBody>
                <Typography variant="h6" className="mb-3 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5" />
                  Estimativa de Custos
                </Typography>
                {(() => {
                  const costs = ragService.estimateCost(stats.totalChunks);
                  return (
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded">
                        <Typography variant="small" className="font-medium">
                          Embeddings ({ragService.config.embeddingModel})
                        </Typography>
                        <div className="flex justify-between mt-1">
                          <Typography variant="small" color="gray">
                            {costs.embedding.tokens.toLocaleString()} tokens
                          </Typography>
                          <Typography variant="small" className="font-medium text-green-600">
                            ${costs.embedding.cost.toFixed(4)}
                          </Typography>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-white rounded">
                        <Typography variant="small" className="font-medium">
                          Uso Estimado de Chat (10 queries)
                        </Typography>
                        <div className="flex justify-between mt-1">
                          <Typography variant="small" color="gray">
                            ~20,000 tokens
                          </Typography>
                          <Typography variant="small" className="font-medium text-green-600">
                            $0.60
                          </Typography>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 flex justify-between">
                        <Typography className="font-bold">Total Estimado:</Typography>
                        <Typography className="font-bold text-green-600 text-lg">
                          ${(costs.total + 0.60).toFixed(2)}
                        </Typography>
                      </div>
                    </div>
                  );
                })()}
              </CardBody>
            </Card>

            {/* Informações adicionais */}
            {stats.duplicateChunks > 0 && (
              <Alert color="amber" className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                {stats.duplicateChunks} chunks duplicados foram detectados e otimizados
              </Alert>
            )}
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="text" onClick={() => setShowStats(false)}>
          Fechar
        </Button>
      </DialogFooter>
    </Dialog>
  );

  // UI do histórico
  const HistoryDialog = () => (
    <Dialog open={showSavedIndexes} handler={() => setShowSavedIndexes(false)} size="lg">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-6 w-6" />
          Histórico de Consultas
        </div>
      </DialogHeader>
      <DialogBody className="overflow-y-auto max-h-[60vh]">
        {queryHistory.length > 0 ? (
          <List>
            {queryHistory.map((item, idx) => (
              <ListItem 
                key={idx} 
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  loadFromHistory(item);
                  setShowSavedIndexes(false);
                }}
              >
                <div className="w-full">
                  <div className="flex justify-between items-start mb-1">
                    <Typography variant="small" className="font-medium">
                      {item.query}
                    </Typography>
                    <Chip
                      value={`${item.sources} fontes`}
                      size="sm"
                      color="blue"
                    />
                  </div>
                  <Typography variant="small" color="gray">
                    {item.answer}
                  </Typography>
                  <Typography variant="small" color="blue-gray" className="mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </Typography>
                </div>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="gray" className="text-center py-8">
            Nenhuma consulta realizada ainda
          </Typography>
        )}
      </DialogBody>
      <DialogFooter>
        <Button
          variant="text"
          color="red"
          onClick={() => {
            if (confirm('Deseja limpar todo o histórico?')) {
              setQueryHistory([]);
              localStorage.removeItem('query_history');
            }
          }}
          className="mr-auto"
        >
          Limpar Histórico
        </Button>
        <Button variant="text" onClick={() => setShowSavedIndexes(false)}>
          Fechar
        </Button>
      </DialogFooter>
    </Dialog>
  );

  if (!ConfigService.hasApiKey()) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardBody className="flex justify-between items-center">
          <div>
            <Typography variant="h3" color="blue-gray" className="flex items-center gap-2">
              <SparklesIcon className="h-8 w-8 text-blue-500" />
              Sistema RAG de Alta Qualidade
            </Typography>
            <Typography color="gray" className="mt-1">
              {ragService.config.embeddingModel} • {ragService.config.chatModel}
            </Typography>
          </div>
          <div className="flex gap-2">
            <Tooltip content="Histórico">
              <IconButton
                variant="text"
                onClick={() => setShowSavedIndexes(true)}
              >
                <ClockIcon className="h-5 w-5" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Configurações">
              <IconButton
                variant="text"
                onClick={handleReset}
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </IconButton>
            </Tooltip>
          </div>
        </CardBody>
      </Card>

      {/* Upload e Gerenciamento */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h5">Gerenciamento de Documentos</Typography>
            {uploadedFile && (
              <div className="flex items-center gap-2">
                <Chip 
                  value={uploadedFile.name} 
                  color="green" 
                  icon={<DocumentIcon className="h-4 w-4" />}
                />
                <IconButton
                  size="sm"
                  variant="text"
                  color="red"
                  onClick={() => {
                    if (confirm('Deseja remover este documento?')) {
                      handleReset();
                    }
                  }}
                >
                  <XMarkIcon className="h-4 w-4" />
                </IconButton>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Upload PDF */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              color="blue"
              className="flex items-center justify-center gap-2"
            >
              <DocumentIcon className="h-5 w-5" />
              Novo PDF
            </Button>

            {/* Importar Índice */}
            <input
              ref={indexInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isProcessing}
              className="hidden"
            />
            <Button
              onClick={() => indexInputRef.current?.click()}
              variant="outlined"
              disabled={isProcessing}
              className="flex items-center justify-center gap-2"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Importar
            </Button>

            {/* Exportar */}
            {uploadedFile && (
              <Button
                onClick={handleExport}
                variant="outlined"
                disabled={isProcessing}
                className="flex items-center justify-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Exportar
              </Button>
            )}

            {/* Estatísticas */}
            {stats && (
              <Button
                onClick={() => setShowStats(true)}
                variant="outlined"
                color="blue-gray"
                className="flex items-center justify-center gap-2"
              >
                <ChartBarIcon className="h-5 w-5" />
                Estatísticas
              </Button>
            )}
          </div>

          {/* Informações do documento */}
          {stats && !progress && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <Typography variant="small" color="gray">Páginas</Typography>
                  <Typography className="font-bold">{stats.pagesProcessed}</Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray">Chunks</Typography>
                  <Typography className="font-bold">{stats.totalChunks}</Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray">Tokens</Typography>
                  <Typography className="font-bold">{(stats.totalTokens / 1000).toFixed(1)}k</Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray">Custo</Typography>
                  <Typography className="font-bold text-green-600">
                    ${ragService.estimateCost(stats.totalChunks).total.toFixed(3)}
                  </Typography>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Progresso */}
      {progress && (
        <Card>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Typography className="font-medium">
                  {progress.message}
                </Typography>
                <Typography className="font-bold text-blue-600">
                  {Math.round(progress.percentage)}%
                </Typography>
              </div>
              <Progress 
                value={progress.percentage} 
                color="blue" 
                className="h-3"
              />
              {progress.current && (
                <Typography variant="small" color="gray" className="text-center">
                  {progress.current} de {progress.total} processados
                </Typography>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Interface de Busca */}
      {uploadedFile && !progress && (
        <Card>
          <CardBody>
            <Typography variant="h5" className="mb-4">
              Fazer Pergunta
            </Typography>
            
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite sua pergunta sobre o documento..."
                  rows={3}
                  disabled={isProcessing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleQuery();
                    }
                  }}
                />
                <Typography variant="small" color="gray" className="absolute bottom-2 right-2">
                  Ctrl+Enter para enviar
                </Typography>
              </div>
              
              <Button
                onClick={handleQuery}
                disabled={isProcessing || !query.trim() || isStreaming}
                color="green"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                {isStreaming ? 'Gerando resposta...' : 'Buscar e Responder'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Resposta */}
      {response && (
        <Card>
          <CardBody>
            <div className="flex justify-between items-start mb-4">
              <Typography variant="h5">Resposta</Typography>
              <div className="flex items-center gap-2">
                {response.cached && (
                  <Chip
                    value="Cache"
                    color="green"
                    size="sm"
                    icon={<CheckCircleIcon className="h-4 w-4" />}
                  />
                )}
                {response.responseTime && (
                  <Chip
                    value={`${response.responseTime.toFixed(1)}s`}
                    color="blue"
                    size="sm"
                    icon={<ClockIcon className="h-4 w-4" />}
                  />
                )}
                {response.isStreaming && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <Typography variant="small" color="blue">
                      Processando...
                    </Typography>
                  </div>
                )}
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <Typography className="whitespace-pre-wrap leading-relaxed">
                {response.answer}
              </Typography>
            </div>

            {response.sources && response.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <Typography variant="h6" className="mb-3">
                  Fontes Utilizadas ({response.sources.length})
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {response.sources.map((source, idx) => (
                    <Card key={idx} className="bg-gray-50">
                      <CardBody className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Chip
                            value={`Página ${source.pageNumber}`}
                            size="sm"
                            color="blue"
                          />
                          <Typography variant="small" color="gray">
                            Relevância: {((source.importance || 1) * 100).toFixed(0)}%
                          </Typography>
                        </div>
                        <Typography variant="small" color="gray">
                          Chunk #{source.chunkIndex + 1} • {source.totalTokens} tokens
                        </Typography>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Erros */}
      {error && (
        <Alert
          color="red"
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            <div className="flex-1">
              <Typography className="font-medium">Erro</Typography>
              <Typography variant="small">{error}</Typography>
            </div>
          </div>
          <IconButton
            size="sm"
            variant="text"
            color="white"
            onClick={() => setError(null)}
          >
            <XMarkIcon className="h-4 w-4" />
          </IconButton>
        </Alert>
      )}

      {/* Dialogs */}
      <StatsDialog />
      <HistoryDialog />
    </div>
  );
}