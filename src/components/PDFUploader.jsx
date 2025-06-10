import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Spinner,
  Alert,
} from '@material-tailwind/react';
import { DocumentIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

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

      console.log('Texto extraído:', fullText);
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
    <Card className="w-full max-w-lg mx-auto">
      <CardBody className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <DocumentIcon className="h-8 w-8 text-blue-500" />
          <Typography variant="h4" color="blue-gray">
            Upload de PDF
          </Typography>
        </div>
        
        <label className="block">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) extractTextFromPDF(file);
            }}
            className="hidden"
            disabled={loading}
            id="pdf-upload"
          />
          <Button
            variant="gradient"
            color="blue"
            size="lg"
            className="flex items-center gap-3 w-full justify-center"
            onClick={() => document.getElementById('pdf-upload').click()}
            disabled={loading}
          >
            <CloudArrowUpIcon className="h-5 w-5" />
            Selecionar arquivo PDF
          </Button>
        </label>
      
      {loading && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <Spinner className="h-10 w-10" color="blue" />
          <Typography color="gray" className="text-sm">
            Extraindo texto do PDF...
          </Typography>
        </div>
      )}
      
      {fileName && !loading && (
        <Alert
          color="green"
          icon={<CheckCircleIcon className="h-5 w-5" />}
          className="mt-6"
        >
          <Typography className="font-medium">
            PDF carregado com sucesso!
          </Typography>
          <Typography color="green" className="text-sm font-normal opacity-80">
            {fileName}
          </Typography>
        </Alert>
      )}
      
      {/* Área de drag and drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-6 border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          isDragging 
            ? 'border-blue-400 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <CloudArrowUpIcon 
          className={`mx-auto h-16 w-16 mb-4 transition-colors ${
            isDragging ? 'text-blue-500' : 'text-gray-400'
          }`}
        />
        <Typography
          variant="h6"
          color={isDragging ? 'blue' : 'blue-gray'}
          className="mb-2"
        >
          {isDragging 
            ? 'Solte o arquivo aqui' 
            : 'Arraste seu PDF aqui'}
        </Typography>
        <Typography
          variant="small"
          color="gray"
          className="font-normal"
        >
          ou clique no botão acima para selecionar
        </Typography>
      </div>
      </CardBody>
    </Card>
  );
}