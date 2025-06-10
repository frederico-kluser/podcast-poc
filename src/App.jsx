/**
 * @fileoverview Main application component - refactored with advanced patterns
 */

import { useState, useCallback } from 'react';
import { Typography } from '@material-tailwind/react';

// Components
import { PDFUploader } from './components/features/PDFUploader';
import { ExtractedTextDisplay } from './components/features/ExtractedTextDisplay';
import { ChatInterface } from './components/features/ChatInterface';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

/**
 * Main application component for the Podcast POC
 * Handles PDF upload, text extraction, and ChatGPT interaction
 * 
 * @component
 * @returns {JSX.Element}
 */
function App() {
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedText, setExtractedText] = useState(null);

  /**
   * Handle text extraction completion
   * @param {Object} textData - Extracted text data
   */
  const handleTextExtracted = useCallback((textData) => {
    console.log('Text extracted successfully:', {
      pageCount: textData.pageCount,
      wordCount: textData.content.split(/\s+/).length,
      extractedAt: textData.extractedAt
    });
    console.log('Extracted content:', textData.content); // Log do conteúdo extraído
    setExtractedText(textData); // Armazena o texto extraído
    setErrorMessage(''); // Clear any previous errors
  }, []);

  /**
   * Handle application reset
   */
  const handleReset = useCallback(() => {
    setExtractedText(null);
    setErrorMessage('');
  }, []);

  /**
   * Handle error messages from child components
   * @param {string} error - Error message
   */
  const handleError = useCallback((error) => {
    setErrorMessage(error);
    console.error('Application error:', error);
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setErrorMessage('');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <Typography variant="h1" className="text-4xl font-bold text-gray-800 mb-4">
            Gerador de Podcasts Educativos
          </Typography>
          <Typography variant="lead" color="gray" className="text-lg">
            Transforme seus PDFs em conversas educativas envolventes
          </Typography>
        </header>

        {/* Error Display */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <Typography color="red" className="font-medium">
                  {errorMessage}
                </Typography>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600 ml-4"
                  aria-label="Fechar erro"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">
          {!extractedText ? (
            // PDF Upload Phase
            <PDFUploader 
              onTextExtracted={handleTextExtracted}
              onError={handleError}
            />
          ) : (
            // Text Extracted Phase
            <div className="space-y-6">
              {/* Extracted Text Display */}
              <ExtractedTextDisplay 
                extractedText={extractedText}
                onReset={handleReset}
              />

              {/* Chat Interface */}
              <ChatInterface 
                context={extractedText.content}
                onError={handleError}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-gray-200">
          <Typography variant="small" color="gray">
            Powered by OpenAI GPT-4 & Whisper • Built with React & Material Tailwind
          </Typography>
        </footer>
      </div>
    </div>
  );
}

/**
 * App component wrapped with error boundary
 */
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;