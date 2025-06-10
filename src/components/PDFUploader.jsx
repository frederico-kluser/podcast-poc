import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js - usar arquivo local
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export function PDFUploader({ onTextExtracted }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const extractTextFromPDF = async (file) => {
    setLoading(true);
    setFileName(file.name);

    try {
      // Converter arquivo para ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Carregar PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      // Extrair texto de cada página
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Agrupar items por linha baseado na posição Y
        const lines = {};
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item);
        });
        
        // Ordenar linhas e concatenar texto
        const sortedLines = Object.keys(lines).sort((a, b) => b - a);
        const pageText = sortedLines.map(y => {
          return lines[y]
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map(item => item.str)
            .join('')
            .trim();
        }).filter(line => line).join('\n');
        
        fullText += pageText + '\n\n';
      }

      onTextExtracted(fullText);
    } catch (error) {
      console.error('Erro ao extrair texto:', error);
      alert('Erro ao processar PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      extractTextFromPDF(pdfFile);
    } else {
      alert('Por favor, arraste apenas arquivos PDF');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <label className="block">
        <span className="text-gray-700 font-semibold mb-2 block">
          Upload do PDF
        </span>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) extractTextFromPDF(file);
          }}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer"
          disabled={loading}
        />
      </label>
      
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-600">Extraindo texto...</p>
        </div>
      )}
      
      {fileName && !loading && (
        <p className="mt-4 text-sm text-green-600">
          ✓ {fileName} carregado com sucesso!
        </p>
      )}
      
      {/* Área de drag and drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <svg 
          className="mx-auto h-12 w-12 text-gray-400 mb-3" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        <p className="text-sm text-gray-600">
          {isDragging 
            ? 'Solte o arquivo aqui...' 
            : 'Arraste e solte um arquivo PDF aqui'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          ou use o botão acima para selecionar
        </p>
      </div>
    </div>
  );
}