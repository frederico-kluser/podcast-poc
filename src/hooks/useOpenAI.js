/**
 * @fileoverview Custom hook for OpenAI integration
 */

import { useState, useCallback, useMemo } from 'react';
import { createOpenAIService } from '../services/openai.service';

/**
 * Custom hook for OpenAI chat and transcription
 * @param {string} apiKey - OpenAI API key
 * @returns {Object} OpenAI utilities and state
 */
export const useOpenAI = (apiKey) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  // Memoize service instance
  const openAIService = useMemo(() => {
    return apiKey ? createOpenAIService(apiKey) : null;
  }, [apiKey]);

  /**
   * Send chat message with streaming
   * @param {string} prompt - User prompt
   * @param {string} context - PDF context
   * @param {function} onChunk - Callback for response chunks
   * @returns {Promise<string>} Complete response
   */
  const sendMessage = useCallback(async (prompt, context = '', onChunk) => {
    if (!openAIService) {
      throw new Error('OpenAI service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await openAIService.sendChatMessage(prompt, context, onChunk);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [openAIService]);

  /**
   * Transcribe audio to text
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<string>} Transcribed text
   */
  const transcribeAudio = useCallback(async (audioBlob, language = 'pt') => {
    if (!openAIService) {
      throw new Error('OpenAI service not initialized');
    }

    setIsTranscribing(true);
    setError(null);

    try {
      const transcription = await openAIService.transcribeAudio(audioBlob, language);
      return transcription;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, [openAIService]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    transcribeAudio,
    clearError,
    isLoading,
    isTranscribing,
    error,
    isReady: !!openAIService,
  };
};