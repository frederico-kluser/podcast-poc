import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Progress,
  Input,
  Chip,
  Alert,
  Select,
  Option
} from '@material-tailwind/react';
import { 
  ArrowPathIcon, 
  CogIcon, 
  BoltIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { TextCorrectionService } from '../../services/textCorrection.service';

export function ParallelProcessingDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [config, setConfig] = useState(TextCorrectionService.getParallelConfig());
  const [progressDetails, setProgressDetails] = useState(null);
  const [error, setError] = useState(null);

  const generateTestChunks = (count) => {
    const testTexts = [
      "Esteéumtextocomespaçosfaltando",
      "Apáginacontém3exemplosdiferentes",
      "Osistemaprocessatextosrapidamente",
      "Paralelizaçãomelhoraperformance",
      "APIOpenAIpermiteváriasrequisições"
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      text: testTexts[i % testTexts.length] + ` (chunk ${i + 1})`
    }));
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResults(null);

    try {
      // Update configuration
      TextCorrectionService.configureParallelProcessing(config);

      // Generate test chunks
      const chunks = generateTestChunks(20);
      
      // Estimate processing time
      const estimate = await TextCorrectionService.estimateParallelProcessingTime(chunks);
      console.log('📊 Estimativa de processamento:', estimate);

      // Process chunks
      const startTime = Date.now();
      const correctedChunks = await TextCorrectionService.correctInBatches(chunks, (progress) => {
        setProgress(progress.percentage);
        setProgressDetails(progress);
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Calculate statistics
      const successCount = correctedChunks.filter(c => !c.error).length;
      const errorCount = correctedChunks.filter(c => c.error).length;

      setResults({
        chunks: correctedChunks,
        totalTime,
        successCount,
        errorCount,
        averageTime: totalTime / chunks.length,
        chunksPerSecond: chunks.length / (totalTime / 1000)
      });

    } catch (error) {
      console.error('Erro no processamento:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig({
      ...config,
      [key]: value
    });
  };

  return (
    <Card className="w-full">
      <CardBody className="space-y-6">
        <div className="flex items-center justify-between">
          <Typography variant="h5" className="flex items-center gap-2">
            <BoltIcon className="h-6 w-6 text-blue-500" />
            Demonstração de Processamento Paralelo
          </Typography>
          <Chip 
            value={isProcessing ? "Processando..." : "Pronto"} 
            color={isProcessing ? "blue" : "green"}
            size="sm"
          />
        </div>

        {/* Configuration Section */}
        <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CogIcon className="h-5 w-5 text-gray-600" />
            <Typography variant="h6">Configurações de Paralelização</Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Typography variant="small" className="mb-1">
                Concorrência (requisições simultâneas)
              </Typography>
              <Select
                value={String(config.concurrency)}
                onChange={(value) => handleConfigChange('concurrency', parseInt(value))}
                disabled={isProcessing}
              >
                <Option value="1">1 (Sequencial)</Option>
                <Option value="3">3 (Baixa)</Option>
                <Option value="5">5 (Média)</Option>
                <Option value="8">8 (Recomendada)</Option>
                <Option value="10">10 (Alta)</Option>
                <Option value="15">15 (Muito Alta)</Option>
              </Select>
            </div>

            <div>
              <Typography variant="small" className="mb-1">
                Limite de requisições por minuto
              </Typography>
              <Input
                type="number"
                value={config.maxRequestsPerMinute}
                onChange={(e) => handleConfigChange('maxRequestsPerMinute', parseInt(e.target.value))}
                disabled={isProcessing}
                min="60"
                max="10000"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2"
                color="blue"
              >
                {isProcessing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <BoltIcon className="h-4 w-4" />
                    Iniciar Teste
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Typography variant="small">Progresso</Typography>
              <Typography variant="small" className="font-medium">
                {progress.toFixed(1)}%
              </Typography>
            </div>
            <Progress value={progress} color="blue" />
            
            {progressDetails && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Concluídas
                  </Typography>
                  <Typography className="font-bold text-blue-600">
                    {progressDetails.current}/{progressDetails.total}
                  </Typography>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Em Processamento
                  </Typography>
                  <Typography className="font-bold text-orange-600">
                    {progressDetails.inFlight || 0}
                  </Typography>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Taxa Atual
                  </Typography>
                  <Typography className="font-bold text-green-600">
                    {progressDetails.elapsedTime 
                      ? `${(progressDetails.current / (progressDetails.elapsedTime / 1000)).toFixed(1)} req/s`
                      : '0 req/s'
                    }
                  </Typography>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Tempo Decorrido
                  </Typography>
                  <Typography className="font-bold text-purple-600">
                    {progressDetails.elapsedTime 
                      ? `${(progressDetails.elapsedTime / 1000).toFixed(1)}s`
                      : '0s'
                    }
                  </Typography>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert color="red" className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            {error}
          </Alert>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-green-600" />
              <Typography variant="h6">Resultados do Processamento</Typography>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20">
                <CardBody className="p-4">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Tempo Total
                  </Typography>
                  <Typography variant="h4" className="text-green-600">
                    {(results.totalTime / 1000).toFixed(2)}s
                  </Typography>
                </CardBody>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-900/20">
                <CardBody className="p-4">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Taxa de Processamento
                  </Typography>
                  <Typography variant="h4" className="text-blue-600">
                    {results.chunksPerSecond.toFixed(2)} chunks/s
                  </Typography>
                </CardBody>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/20">
                <CardBody className="p-4">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Tempo Médio/Chunk
                  </Typography>
                  <Typography variant="h4" className="text-purple-600">
                    {(results.averageTime / 1000).toFixed(2)}s
                  </Typography>
                </CardBody>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/20">
                <CardBody className="p-4">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Sucessos
                  </Typography>
                  <Typography variant="h4" className="text-green-600">
                    {results.successCount}
                  </Typography>
                </CardBody>
              </Card>

              <Card className="bg-red-50 dark:bg-red-900/20">
                <CardBody className="p-4">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Erros
                  </Typography>
                  <Typography variant="h4" className="text-red-600">
                    {results.errorCount}
                  </Typography>
                </CardBody>
              </Card>

              <Card className="bg-amber-50 dark:bg-amber-900/20">
                <CardBody className="p-4">
                  <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                    Taxa de Sucesso
                  </Typography>
                  <Typography variant="h4" className="text-amber-600">
                    {((results.successCount / results.chunks.length) * 100).toFixed(1)}%
                  </Typography>
                </CardBody>
              </Card>
            </div>

            {/* Comparison with Sequential Processing */}
            <Alert color="blue" className="mt-4">
              <Typography variant="small">
                <strong>Comparação:</strong> Processamento sequencial levaria aproximadamente{' '}
                <strong>{(results.chunks.length * 2).toFixed(0)}s</strong> (assumindo 2s por chunk).
                Com paralelização, você economizou{' '}
                <strong>{((results.chunks.length * 2 - results.totalTime / 1000) / 60).toFixed(1)} minutos</strong>!
              </Typography>
            </Alert>
          </div>
        )}
      </CardBody>
    </Card>
  );
}