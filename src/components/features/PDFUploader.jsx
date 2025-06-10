/**
 * @fileoverview Enhanced PDF uploader component with drag & drop functionality
 */

import { useState } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Spinner,
  Alert,
  Progress,
} from '@material-tailwind/react';
import { DocumentIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { usePDF } from '../../hooks/usePDF';
import { SUCCESS_MESSAGES } from '../../constants';

/**
 * PDFUploader component for handling PDF file uploads with drag & drop
 * 
 * @component
 * @param {Object} props
 * @param {function} props.onTextExtracted - Callback when text is extracted from PDF
 * @param {function} [props.onFileSelect] - Callback when file is selected
 * @param {function} [props.onError] - Callback for error handling
 * @returns {JSX.Element}
 * 
 * @example
 * <PDFUploader 
 *   onTextExtracted={handleTextExtracted}
 *   onError={handleError}
 * />
 */
export function PDFUploader({ onTextExtracted, onFileSelect, onError }) {
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const { 
    extractText, 
    validateFile, 
    isProcessing, 
    progress, 
    error,
    clearError 
  } = usePDF();

  /**
   * Handle file processing
   * @param {File} file - Selected PDF file
   */
  const handleFile = async (file) => {
    if (!file) return;

    setFileName(file.name);
    clearError();

    // Validate file first
    if (!validateFile(file)) {
      if (onError) onError(error);
      return;
    }

    try {
      if (onFileSelect) onFileSelect(file);
      
      const result = await extractText(file);
      onTextExtracted(result);
      
    } catch (err) {
      console.error('PDF processing failed:', err);
      if (onError) onError(err.message);
    }
  };

  /**
   * Handle file input change
   * @param {Event} event - File input change event
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  /**
   * Handle drag over event
   * @param {DragEvent} event - Drag event
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  /**
   * Handle drag leave event
   * @param {DragEvent} event - Drag event
   */
  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  /**
   * Handle file drop event
   * @param {DragEvent} event - Drop event
   */
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(event.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFile(pdfFile);
    } else {
      const errorMsg = 'Por favor, arraste apenas arquivos PDF';
      if (onError) onError(errorMsg);
    }
  };

  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    document.getElementById('pdf-upload')?.click();
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
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing}
            id="pdf-upload"
          />
          <Button
            variant="gradient"
            color="blue"
            size="lg"
            className="flex items-center gap-3 w-full justify-center"
            onClick={triggerFileInput}
            disabled={isProcessing}
          >
            <CloudArrowUpIcon className="h-5 w-5" />
            Selecionar arquivo PDF
          </Button>
        </label>
      
        {/* Processing state */}
        {isProcessing && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <Spinner className="h-10 w-10" color="blue" />
            <Typography color="gray" className="text-sm">
              Extraindo texto do PDF...
            </Typography>
            {progress > 0 && (
              <div className="w-full">
                <Progress value={progress} color="blue" className="h-2" />
                <Typography className="text-xs text-center mt-1" color="gray">
                  {Math.round(progress)}%
                </Typography>
              </div>
            )}
          </div>
        )}
        
        {/* Success state */}
        {fileName && !isProcessing && !error && (
          <Alert
            color="green"
            icon={<CheckCircleIcon className="h-5 w-5" />}
            className="mt-6"
          >
            <Typography className="font-medium">
              {SUCCESS_MESSAGES.PDF_UPLOADED}
            </Typography>
            <Typography color="green" className="text-sm font-normal opacity-80">
              {fileName}
            </Typography>
          </Alert>
        )}

        {/* Error state */}
        {error && (
          <Alert color="red" className="mt-6">
            <Typography className="font-medium">
              Erro no processamento
            </Typography>
            <Typography color="red" className="text-sm font-normal opacity-80">
              {error}
            </Typography>
          </Alert>
        )}
        
        {/* Drag and drop area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-6 border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
            isDragging 
              ? 'border-blue-400 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
          onClick={triggerFileInput}
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