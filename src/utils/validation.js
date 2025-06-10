/**
 * @fileoverview Utility functions for validation
 */

import { PDF_CONFIG, AUDIO_CONFIG } from '../constants';

/**
 * Validate PDF file
 * @param {File} file - File to validate
 * @returns {{isValid: boolean, error: string|null}} Validation result
 * 
 * @example
 * const result = validatePDFFile(file);
 * if (!result.isValid) console.error(result.error);
 */
export function validatePDFFile(file) {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > PDF_CONFIG.MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `File too large. Maximum size: ${formatFileSize(PDF_CONFIG.MAX_FILE_SIZE)}` 
    };
  }

  if (!PDF_CONFIG.ACCEPTED_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Only PDF files are accepted.' 
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate audio blob
 * @param {Blob} audioBlob - Audio blob to validate
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
export function validateAudioBlob(audioBlob) {
  if (!audioBlob) {
    return { isValid: false, error: 'No audio data provided' };
  }

  if (audioBlob.size === 0) {
    return { isValid: false, error: 'Audio data is empty' };
  }

  if (!audioBlob.type.startsWith('audio/')) {
    return { isValid: false, error: 'Invalid audio format' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate text prompt
 * @param {string} prompt - Text prompt to validate
 * @param {Object} [options] - Validation options
 * @param {number} [options.minLength=1] - Minimum length
 * @param {number} [options.maxLength=4000] - Maximum length
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
export function validatePrompt(prompt, options = {}) {
  const { minLength = 1, maxLength = 4000 } = options;

  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt must be a non-empty string' };
  }

  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length < minLength) {
    return { 
      isValid: false, 
      error: `Prompt must be at least ${minLength} character(s) long` 
    };
  }

  if (trimmedPrompt.length > maxLength) {
    return { 
      isValid: false, 
      error: `Prompt cannot exceed ${maxLength} characters` 
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
export function validateAPIKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return { isValid: false, error: 'API key is required' };
  }

  const trimmedKey = apiKey.trim();

  if (trimmedKey.length === 0) {
    return { isValid: false, error: 'API key cannot be empty' };
  }

  // Basic OpenAI API key format validation
  if (!trimmedKey.startsWith('sk-')) {
    return { isValid: false, error: 'Invalid API key format' };
  }

  if (trimmedKey.length < 20) {
    return { isValid: false, error: 'API key appears to be too short' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
export function validateURL(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true, error: null };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize HTML content
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  if (!html) return '';
  
  // Basic HTML sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

// Helper function to format file size (if not imported from format.js)
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}