import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js - use absolute URLs for better compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs';

self.onmessage = async function(event) {
  const { type, data } = event.data;
  
  if (type === 'process-pdf') {
    try {
      const { arrayBuffer, chunkSize } = data;
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const chunks = [];
      
      // Processar em batches de páginas
      const PAGES_PER_BATCH = 5;
      
      for (let startPage = 1; startPage <= totalPages; startPage += PAGES_PER_BATCH) {
        const endPage = Math.min(startPage + PAGES_PER_BATCH - 1, totalPages);
        const batchChunks = [];
        
        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Reconstruir texto preservando estrutura
          const pageText = reconstructPageText(textContent);
          
          batchChunks.push({
            pageNumber: pageNum,
            text: pageText,
            estimatedTokens: Math.ceil(pageText.length / 3)
          });
          
          page.cleanup();
        }
        
        // Enviar batch processado
        self.postMessage({
          type: 'batch-complete',
          data: {
            chunks: batchChunks,
            progress: {
              current: endPage,
              total: totalPages,
              percentage: (endPage / totalPages) * 100
            }
          }
        });
        
        // Pequena pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      self.postMessage({ type: 'processing-complete' });
      
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }
};

function reconstructPageText(textContent) {
  const lines = {};
  
  // Handle both array and object formats
  const items = textContent.items || textContent;
  if (!items || !Array.isArray(items)) {
    return '';
  }
  
  items.forEach(item => {
    // Ensure item has required properties
    if (!item.transform || !item.str) return;
    
    const y = Math.round(item.transform[5]);
    if (!lines[y]) lines[y] = [];
    lines[y].push(item);
  });
  
  return Object.keys(lines)
    .sort((a, b) => b - a)
    .map(y => {
      return lines[y]
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map(item => item.str || '')
        .join(' ')
        .trim();
    })
    .filter(line => line.length > 0)
    .join('\n');
}