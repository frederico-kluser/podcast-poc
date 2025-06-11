/**
 * @fileoverview PDF processing service
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDF_CONFIG, ERROR_MESSAGES } from '../constants';

// Configure PDF.js to use CDN worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs';

/**
 * PDF processing service class
 */
export class PDFService {
  /**
   * Validate PDF file before processing
   * @param {File} file - PDF file to validate
   * @throws {Error} When file is invalid
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > PDF_CONFIG.MAX_FILE_SIZE) {
      throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    if (!PDF_CONFIG.ACCEPTED_TYPES.includes(file.type)) {
      throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }
  }

  /**
   * Extract text from PDF file
   * @param {File} file - PDF file to process
   * @param {function} onProgress - Progress callback (optional)
   * @returns {Promise<{content: string, pageCount: number, extractedAt: Date}>}
   * @throws {Error} When extraction fails
   */
  async extractText(file, onProgress) {
    this.validateFile(file);

    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group items by line based on Y position
        const lines = {};
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item);
        });
        
        // Sort lines and concatenate text
        const sortedLines = Object.keys(lines).sort((a, b) => b - a);
        const pageText = sortedLines.map(y => {
          return lines[y]
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map(item => item.str)
            .join('')
            .trim();
        }).filter(line => line).join('\n');
        
        fullText += pageText + '\n\n';

        // Report progress if callback provided
        if (onProgress) {
          onProgress({
            currentPage: i,
            totalPages: pdf.numPages,
            progress: (i / pdf.numPages) * 100
          });
        }
      }

      return {
        content: fullText.trim(),
        pageCount: pdf.numPages,
        extractedAt: new Date()
      };
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw new Error(ERROR_MESSAGES.PDF_PROCESSING);
    }
  }

  /**
   * Get PDF metadata
   * @param {File} file - PDF file
   * @returns {Promise<Object>} PDF metadata
   */
  async getMetadata(file) {
    this.validateFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const metadata = await pdf.getMetadata();

      return {
        pageCount: pdf.numPages,
        title: metadata.info?.Title || 'Untitled',
        author: metadata.info?.Author || 'Unknown',
        subject: metadata.info?.Subject || '',
        creator: metadata.info?.Creator || '',
        producer: metadata.info?.Producer || '',
        creationDate: metadata.info?.CreationDate || null,
        modificationDate: metadata.info?.ModDate || null,
      };
    } catch (error) {
      console.error('Failed to get PDF metadata:', error);
      throw new Error('Failed to extract PDF metadata');
    }
  }
}

/**
 * Create PDF service instance
 * @returns {PDFService} Service instance
 */
export const createPDFService = () => {
  return new PDFService();
};