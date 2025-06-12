import { useState, useCallback } from 'react';
import { TextCorrectionService } from '../services/textCorrection.service';

export function useTextCorrection() {
  const [isCorrepting, setIsCorrepting] = useState(false);
  const [correctionProgress, setCorrectionProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    message: ''
  });
  const [correctionMetrics, setCorrectionMetrics] = useState(null);
  const [error, setError] = useState(null);

  const correctText = useCallback(async (text, options = {}) => {
    setIsCorrepting(true);
    setError(null);
    setCorrectionProgress({
      current: 0,
      total: 1,
      percentage: 0,
      message: 'Iniciando correção de texto...'
    });

    try {
      const correctedText = await TextCorrectionService.correctSpacing(text, options);
      
      setCorrectionProgress({
        current: 1,
        total: 1,
        percentage: 100,
        message: 'Correção concluída!'
      });

      // Get updated metrics
      const metrics = TextCorrectionService.getMetricsSummary();
      setCorrectionMetrics(metrics);

      return correctedText;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsCorrepting(false);
    }
  }, []);

  const correctBatch = useCallback(async (texts) => {
    setIsCorrepting(true);
    setError(null);
    
    const chunks = texts.map((text, index) => ({
      text: typeof text === 'string' ? text : text.text,
      index,
      ...text
    }));

    try {
      const correctedChunks = await TextCorrectionService.correctInBatches(
        chunks,
        (progress) => {
          setCorrectionProgress({
            ...progress,
            message: `Corrigindo: ${progress.current}/${progress.total} textos`
          });
        }
      );

      // Get updated metrics
      const metrics = TextCorrectionService.getMetricsSummary();
      setCorrectionMetrics(metrics);

      return correctedChunks;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsCorrepting(false);
    }
  }, []);

  const estimateCost = useCallback((textLength, chunks = 1) => {
    return TextCorrectionService.estimateCost(textLength, chunks);
  }, []);

  const getMetrics = useCallback(() => {
    return TextCorrectionService.getMetricsSummary();
  }, []);

  const exportMetrics = useCallback(() => {
    const metrics = TextCorrectionService.exportMetrics();
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correction-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const resetMetrics = useCallback(() => {
    TextCorrectionService.resetMetrics();
    setCorrectionMetrics(null);
  }, []);

  return {
    correctText,
    correctBatch,
    estimateCost,
    getMetrics,
    exportMetrics,
    resetMetrics,
    isCorrepting,
    correctionProgress,
    correctionMetrics,
    error
  };
}