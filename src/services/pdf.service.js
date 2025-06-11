/**
 * @fileoverview PDF processing service
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDF_CONFIG, ERROR_MESSAGES } from '../constants';

// Configure PDF.js to use CDN worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs';

// Dynamic import for pdf-parse to avoid build issues
let pdfParse = null;
const loadPdfParse = async () => {
  if (!pdfParse) {
    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch (error) {
      console.warn('pdf-parse not available, using fallback method');
    }
  }
  return pdfParse;
};

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
        
        // Sort lines and concatenate text with improved spacing
        const sortedLines = Object.keys(lines).sort((a, b) => b - a);
        const pageText = sortedLines.map(y => {
          const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
          let lineText = '';
          
          for (let i = 0; i < lineItems.length; i++) {
            const item = lineItems[i];
            if (i > 0) {
              const prevItem = lineItems[i - 1];
              const prevEnd = prevItem.transform[4] + prevItem.width;
              const currentStart = item.transform[4];
              
              // Add space if there's a gap between items
              if (currentStart - prevEnd > 1) {
                lineText += ' ';
              }
            }
            lineText += item.str;
          }
          
          return lineText.trim();
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

      const finalText = fullText.trim();
      console.log('📄 Texto extraído do PDF:', finalText);
      
      return {
        content: finalText,
        pageCount: pdf.numPages,
        extractedAt: new Date()
      };
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw new Error(ERROR_MESSAGES.PDF_PROCESSING);
    }
  }

  /**
   * Extract text using pdf-parse (alternative method)
   * @param {File} file - PDF file to process
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Extracted text data
   */
  async extractTextWithPdfParse(file, onProgress) {
    const parser = await loadPdfParse();
    if (!parser) {
      // Fallback to original method if pdf-parse is not available
      return this.extractText(file, onProgress);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const data = await parser(buffer, {
        // Options for better text extraction
        normalizeWhitespace: true,
        disableCombineTextItems: false
      });

      // Call progress callback with completion
      if (onProgress) {
        onProgress({
          currentPage: data.numpages,
          totalPages: data.numpages,
          progress: 100
        });
      }

      console.log('📄 Texto extraído do PDF (pdf-parse):', data.text);
      
      return {
        content: data.text,
        pageCount: data.numpages,
        extractedAt: new Date()
      };
    } catch (error) {
      console.warn('pdf-parse extraction failed, falling back to pdfjs:', error);
      return this.extractText(file, onProgress);
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