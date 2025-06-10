/**
 * @fileoverview Custom hook for audio recording
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createAudioService } from '../services/audio.service';

/**
 * Custom hook for audio recording functionality
 * @returns {Object} Audio recording utilities and state
 */
export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const audioServiceRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Initialize audio service
  useEffect(() => {
    audioServiceRef.current = createAudioService();
    setIsSupported(audioServiceRef.current.isSupported());

    return () => {
      // Cleanup on unmount
      if (audioServiceRef.current) {
        audioServiceRef.current.cleanup?.();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  /**
   * Request microphone permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  const requestPermission = useCallback(async () => {
    if (!audioServiceRef.current) return false;

    try {
      const granted = await audioServiceRef.current.requestPermission();
      setHasPermission(granted);
      setError(null);
      return granted;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Start recording audio
   * @param {Object} options - Recording options
   * @param {function} options.onComplete - Callback when recording completes
   * @param {function} options.onError - Callback for errors
   * @returns {Promise<void>}
   */
  const startRecording = useCallback(async ({ onComplete, onError } = {}) => {
    if (!audioServiceRef.current || !isSupported) {
      const errorMsg = 'Audio recording is not supported';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    // Request permission if not already granted
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        const errorMsg = 'Microphone permission required';
        setError(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return;
      }
    }

    try {
      setError(null);
      setDuration(0);
      setIsRecording(true);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      await audioServiceRef.current.startRecording({
        onStop: (audioBlob) => {
          setIsRecording(false);
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
          }
          if (onComplete) {
            onComplete(audioBlob);
          }
        },
        onError: (err) => {
          setIsRecording(false);
          setError(err.message);
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
          }
          if (onError) {
            onError(err);
          }
        }
      });
    } catch (err) {
      setIsRecording(false);
      setError(err.message);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (onError) {
        onError(err);
      }
    }
  }, [isSupported, hasPermission, requestPermission]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (audioServiceRef.current && isRecording) {
      audioServiceRef.current.stopRecording();
    }
  }, [isRecording]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Format duration as MM:SS
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  const formatDuration = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    startRecording,
    stopRecording,
    requestPermission,
    clearError,
    formatDuration,
    isRecording,
    isSupported,
    hasPermission,
    duration,
    error,
  };
};