/**
 * @fileoverview Custom hook for PDF processing
 */

import { useState, useCallback, useMemo } from 'react';
import { createPDFService } from '../services/pdf.service';

/**
 * Custom hook for PDF processing
 * @returns {Object} PDF utilities and state
 */
export const usePDF = () => {
  const [extractedText, setExtractedText] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Memoize service instance
  const pdfService = useMemo(() => createPDFService(), []);

  /**
   * Extract text from PDF file
   * @param {File} file - PDF file to process
   * @returns {Promise<Object>} Extracted text data
   */
  const extractText = useCallback(async (file) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const result = await pdfService.extractText(file, (progressData) => {
        setProgress(progressData.progress);
      });

      setExtractedText(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [pdfService]);

  /**
   * Get PDF metadata
   * @param {File} file - PDF file
   * @returns {Promise<Object>} PDF metadata
   */
  const getMetadata = useCallback(async (file) => {
    try {
      return await pdfService.getMetadata(file);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [pdfService]);

  /**
   * Validate PDF file
   * @param {File} file - PDF file to validate
   * @returns {boolean} Whether file is valid
   */
  const validateFile = useCallback((file) => {
    try {
      pdfService.validateFile(file);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [pdfService]);

  /**
   * Clear extracted text and reset state
   */
  const clearText = useCallback(() => {
    setExtractedText(null);
    setProgress(0);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    extractText,
    getMetadata,
    validateFile,
    clearText,
    clearError,
    extractedText,
    isProcessing,
    progress,
    error,
  };
};