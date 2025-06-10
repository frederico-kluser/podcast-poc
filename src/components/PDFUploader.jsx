import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js - usar arquivo local
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export function PDFUploader({ onTextExtracted }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

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
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      onTextExtracted(fullText);
    } catch (error) {
      console.error('Erro ao extrair texto:', error);
      alert('Erro ao processar PDF');
    } finally {
      setLoading(false);
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
    </div>
  );
}