/**
 * @fileoverview Audio recording service
 */

import { AUDIO_CONFIG, ERROR_MESSAGES } from '../constants';

/**
 * Audio recording service class
 */
export class AudioService {
  constructor() {
    this.mediaRecorder = null;
    this.stream = null;
    this.audioChunks = [];
    this.onDataAvailable = null;
    this.onStop = null;
  }

  /**
   * Check if audio recording is supported
   * @returns {boolean} Whether audio recording is supported
   */
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  /**
   * Request microphone permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Audio recording is not supported in this browser');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONFIG.CONSTRAINTS);
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Start audio recording
   * @param {Object} options - Recording options
   * @param {function} options.onDataAvailable - Callback for data chunks
   * @param {function} options.onStop - Callback when recording stops
   * @param {function} options.onError - Callback for errors
   * @returns {Promise<void>}
   * @throws {Error} When recording fails to start
   */
  async startRecording({ onDataAvailable, onStop, onError } = {}) {
    if (!this.isSupported()) {
      throw new Error('Audio recording is not supported');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONFIG.CONSTRAINTS);
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: AUDIO_CONFIG.AUDIO_TYPE
      });

      this.audioChunks = [];
      this.onDataAvailable = onDataAvailable;
      this.onStop = onStop;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: AUDIO_CONFIG.AUDIO_TYPE });
        if (this.onStop) {
          this.onStop(audioBlob);
        }
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        if (onError) {
          onError(event.error);
        } else {
          throw new Error(ERROR_MESSAGES.MICROPHONE_ACCESS);
        }
      };

      this.mediaRecorder.start();

      // Auto-stop after max recording time
      setTimeout(() => {
        if (this.isRecording()) {
          this.stopRecording();
        }
      }, AUDIO_CONFIG.MAX_RECORDING_TIME);

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      throw new Error(ERROR_MESSAGES.MICROPHONE_ACCESS);
    }
  }

  /**
   * Stop audio recording
   * @returns {void}
   */
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Check if currently recording
   * @returns {boolean} Whether recording is active
   */
  isRecording() {
    return this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }

  /**
   * Clean up resources
   * @private
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Get recording duration in seconds
   * @returns {number} Recording duration
   */
  getDuration() {
    if (!this.mediaRecorder) return 0;
    
    // Estimate duration based on chunks (approximate)
    return this.audioChunks.length * 0.1; // Rough estimate
  }
}

/**
 * Create audio service instance
 * @returns {AudioService} Service instance
 */
export const createAudioService = () => {
  return new AudioService();
};