export class OptimizedTextSplitter {
  constructor() {
    // Chunks menores para correção mais precisa
    this.correctionChunkSize = 1500; // ~500 tokens
    this.correctionOverlap = 150;
    
    // Chunks maiores para embeddings após correção
    this.embeddingChunkSize = 2000; // ~666 tokens
    this.embeddingOverlap = 200;
    
    // Separadores em ordem de prioridade
    this.separators = [
      "\n\n\n", // Múltiplas quebras de linha
      "\n\n",   // Parágrafo
      "\n",     // Nova linha
      ". ",     // Fim de sentença
      "! ",     // Exclamação
      "? ",     // Pergunta
      "; ",     // Ponto e vírgula
      ": ",     // Dois pontos
      ", ",     // Vírgula
      " "       // Espaço
    ];
  }

  splitForCorrection(text) {
    return this.splitBySize(text, this.correctionChunkSize, this.correctionOverlap);
  }

  splitForEmbeddings(correctedText) {
    return this.splitWithSemanticBoundaries(
      correctedText, 
      this.embeddingChunkSize, 
      this.embeddingOverlap
    );
  }

  splitBySize(text, chunkSize, overlap) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      
      // Try to find a natural break point
      if (end < text.length) {
        for (const separator of this.separators) {
          const lastSeparator = text.lastIndexOf(separator, end);
          if (lastSeparator > start + chunkSize * 0.5) { // At least 50% of target size
            end = lastSeparator + separator.length;
            break;
          }
        }
      }
      
      const chunk = text.slice(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push({
          text: chunk,
          start: start,
          end: end,
          index: chunks.length,
          charCount: chunk.length,
          estimatedTokens: Math.ceil(chunk.length / 3)
        });
      }
      
      start = end - overlap;
    }
    
    return chunks;
  }

  splitWithSemanticBoundaries(text, chunkSize, overlap) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      
      // Try to find semantic boundaries
      if (end < text.length) {
        // Look for paragraph boundaries first
        const paragraphEnd = text.indexOf('\n\n', start + chunkSize * 0.7);
        if (paragraphEnd > start && paragraphEnd < start + chunkSize * 1.3) {
          end = paragraphEnd + 2;
        } else {
          // Look for sentence boundaries
          const sentenceEnd = this.findSentenceBoundary(text, start + chunkSize * 0.7, start + chunkSize * 1.3);
          if (sentenceEnd > start) {
            end = sentenceEnd;
          }
        }
      }
      
      const chunk = text.slice(start, end).trim();
      
      if (chunk.length > 0) {
        const metadata = this.analyzeChunk(chunk);
        chunks.push({
          text: chunk,
          start: start,
          end: end,
          index: chunks.length,
          ...metadata
        });
      }
      
      start = Math.max(start + 1, end - overlap);
    }
    
    return chunks;
  }

  findSentenceBoundary(text, startSearch, endSearch) {
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    let bestPosition = -1;
    
    for (const ender of sentenceEnders) {
      const pos = text.indexOf(ender, startSearch);
      if (pos > 0 && pos < endSearch) {
        if (bestPosition === -1 || pos < bestPosition) {
          bestPosition = pos + ender.length;
        }
      }
    }
    
    return bestPosition;
  }

  analyzeChunk(text) {
    const metadata = {
      charCount: text.length,
      estimatedTokens: Math.ceil(text.length / 3),
      lineCount: (text.match(/\n/g) || []).length + 1,
      sentenceCount: (text.match(/[.!?]+\s/g) || []).length,
      hasTitle: /^[A-Z\s\d.]{3,100}$/m.test(text.trim()),
      hasList: /^\s*[\d\-*•]\s+/m.test(text),
      hasNumbers: (text.match(/\d+\.?\d*/g) || []).length,
      density: this.calculateTextDensity(text)
    };
    
    return metadata;
  }

  calculateTextDensity(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    return uniqueWords.size / words.length;
  }

  // Merge small chunks to avoid fragmentation
  mergeSmallChunks(chunks, minSize = 300) {
    const merged = [];
    let currentChunk = null;
    
    for (const chunk of chunks) {
      if (!currentChunk) {
        currentChunk = { ...chunk };
      } else if (currentChunk.text.length + chunk.text.length < minSize * 2) {
        // Merge chunks
        currentChunk.text += '\n\n' + chunk.text;
        currentChunk.end = chunk.end;
        currentChunk.charCount = currentChunk.text.length;
        currentChunk.estimatedTokens = Math.ceil(currentChunk.text.length / 3);
      } else {
        merged.push(currentChunk);
        currentChunk = { ...chunk };
      }
    }
    
    if (currentChunk) {
      merged.push(currentChunk);
    }
    
    return merged;
  }

  // Validate chunks for quality
  validateChunks(chunks) {
    const issues = [];
    
    chunks.forEach((chunk, index) => {
      if (chunk.text.length < 50) {
        issues.push({
          index,
          type: 'too_short',
          message: `Chunk ${index} is too short (${chunk.text.length} chars)`
        });
      }
      
      if (chunk.estimatedTokens > 1000) {
        issues.push({
          index,
          type: 'too_long',
          message: `Chunk ${index} is too long (${chunk.estimatedTokens} tokens)`
        });
      }
      
      if (chunk.density < 0.3) {
        issues.push({
          index,
          type: 'low_density',
          message: `Chunk ${index} has low vocabulary density (${chunk.density})`
        });
      }
    });
    
    return issues;
  }
}

export const createOptimizedTextSplitter = () => {
  return new OptimizedTextSplitter();
};