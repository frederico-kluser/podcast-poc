/**
 * @fileoverview Utility functions for validation
 */

import { PDF_CONFIG } from '../constants';

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

// Helper function to format file size
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}