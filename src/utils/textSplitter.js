export class SimpleTextSplitter {
  constructor({ chunkSize = 800, chunkOverlap = 200, separators = ["\n\n", "\n", ". ", "! ", "? ", "; ", ": ", " "] }) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.separators = separators;
  }

  async splitText(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Normalize text
    text = text.trim();
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const chunks = [];
    let currentChunk = '';
    const sentences = this.splitBySeparators(text);

    for (const sentence of sentences) {
      // If adding this sentence would exceed chunk size
      if (currentChunk && (currentChunk.length + sentence.length + 1) > this.chunkSize) {
        // Add current chunk if it has content
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }

        // Start new chunk with overlap from previous chunk
        if (chunks.length > 0 && this.chunkOverlap > 0) {
          const prevChunk = chunks[chunks.length - 1];
          const overlapText = this.getOverlap(prevChunk, this.chunkOverlap);
          currentChunk = overlapText ? overlapText + ' ' + sentence : sentence;
        } else {
          currentChunk = sentence;
        }
      } else {
        // Add sentence to current chunk
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
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

  getOverlap(text, overlapSize) {
    if (!text || overlapSize <= 0) return '';
    
    // Get last words that fit within overlap size
    const words = text.split(' ');
    let overlap = '';
    let currentSize = 0;
    
    for (let i = words.length - 1; i >= 0; i--) {
      const word = words[i];
      if (currentSize + word.length + 1 <= overlapSize) {
        overlap = word + (overlap ? ' ' + overlap : '');
        currentSize += word.length + 1;
      } else {
        break;
      }
    }
    
    return overlap;
  }
}