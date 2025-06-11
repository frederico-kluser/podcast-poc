/**
 * @fileoverview Enhanced text splitter with intelligent chunking
 */

export class SimpleTextSplitter {
  constructor({ 
    chunkSize = 512, 
    chunkOverlap = 50, 
    separators = ["\n\n", "\n", ". ", "! ", "? ", "; ", ": ", " "],
    preserveContext = true,
    tokenizer = null 
  }) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.separators = separators;
    this.preserveContext = preserveContext;
    this.tokenizer = tokenizer || this.defaultTokenizer;
  }

  /**
   * Simple token counter (approximation)
   * @param {string} text - Text to count tokens
   * @returns {number} Approximate token count
   */
  defaultTokenizer(text) {
    // Approximate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  async splitText(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Normalize text
    text = text.trim();
    const textTokens = this.tokenizer(text);
    
    if (textTokens <= this.chunkSize) {
      return [text];
    }

    const chunks = [];
    let currentChunk = '';
    let currentTokenCount = 0;
    const sentences = this.splitBySeparators(text);

    for (const sentence of sentences) {
      const sentenceTokens = this.tokenizer(sentence);
      
      // If adding this sentence would exceed chunk size
      if (currentChunk && (currentTokenCount + sentenceTokens + 1) > this.chunkSize) {
        // Add current chunk if it has content
        if (currentChunk.trim()) {
          chunks.push(this.formatChunk(currentChunk.trim(), chunks.length));
        }

        // Start new chunk with overlap from previous chunk
        if (chunks.length > 0 && this.chunkOverlap > 0) {
          const overlapData = this.getOverlapWithTokens(chunks[chunks.length - 1].text, this.chunkOverlap);
          currentChunk = overlapData.text ? overlapData.text + ' ' + sentence : sentence;
          currentTokenCount = overlapData.tokens + sentenceTokens + 1;
        } else {
          currentChunk = sentence;
          currentTokenCount = sentenceTokens;
        }
      } else {
        // Add sentence to current chunk
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
        currentTokenCount += sentenceTokens + (currentChunk ? 1 : 0);
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(this.formatChunk(currentChunk.trim(), chunks.length));
    }

    return chunks.filter(chunk => chunk.text && chunk.text.length > 0);
  }

  /**
   * Format chunk with metadata
   * @param {string} text - Chunk text
   * @param {number} index - Chunk index
   * @returns {Object} Formatted chunk
   */
  formatChunk(text, index) {
    return {
      text,
      index,
      tokens: this.tokenizer(text),
      metadata: {
        chunkIndex: index,
        hasOverlap: index > 0 && this.chunkOverlap > 0
      }
    };
  }

  splitBySeparators(text) {
    let parts = [text];
    
    for (const separator of this.separators) {
      const newParts = [];
      for (const part of parts) {
        if (part.includes(separator)) {
          const split = part.split(separator);
          for (let i = 0; i < split.length; i++) {
            if (split[i].trim()) {
              newParts.push(split[i].trim());
            }
          }
        } else {
          newParts.push(part);
        }
      }
      parts = newParts;
    }
    
    return parts;
  }

  /**
   * Get overlap text with token count
   * @param {string} text - Text to get overlap from
   * @param {number} overlapTokens - Number of tokens to overlap
   * @returns {Object} Overlap text and token count
   */
  getOverlapWithTokens(text, overlapTokens) {
    if (!text || overlapTokens <= 0) return { text: '', tokens: 0 };
    
    // Get last words that fit within overlap token count
    const words = text.split(' ');
    let overlap = '';
    let currentTokens = 0;
    
    for (let i = words.length - 1; i >= 0; i--) {
      const word = words[i];
      const wordTokens = this.tokenizer(word);
      
      if (currentTokens + wordTokens + (overlap ? 1 : 0) <= overlapTokens) {
        overlap = word + (overlap ? ' ' + overlap : '');
        currentTokens += wordTokens + (overlap ? 1 : 0);
      } else {
        break;
      }
    }
    
    return { text: overlap, tokens: currentTokens };
  }

  /**
   * Split text for PDF processing with page context
   * @param {string} text - PDF text content
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Chunks with metadata
   */
  async splitPDFText(text, options = {}) {
    const { pageBreaks = [], sourceFile = 'unknown' } = options;
    const chunks = await this.splitText(text);
    
    // Enhance chunks with PDF metadata
    return chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        sourceFile,
        pageNumber: this.findPageNumber(chunk.index, pageBreaks)
      }
    }));
  }

  /**
   * Find page number for chunk
   * @private
   */
  findPageNumber(chunkIndex, pageBreaks) {
    // Implementation would map chunk indices to page numbers
    return 1; // Placeholder
  }
}