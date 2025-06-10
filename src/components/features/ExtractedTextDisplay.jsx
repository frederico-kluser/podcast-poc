/**
 * @fileoverview Component for displaying extracted PDF text
 */

import {
  Card,
  CardBody,
  Typography,
  Button,
} from '@material-tailwind/react';
import { ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { PDF_CONFIG } from '../../constants';

/**
 * ExtractedTextDisplay component for showing PDF text content
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.extractedText - Extracted text data
 * @param {string} props.extractedText.content - Text content
 * @param {number} props.extractedText.pageCount - Number of pages
 * @param {Date} props.extractedText.extractedAt - Extraction timestamp
 * @param {function} props.onReset - Callback to reset and load new PDF
 * @param {boolean} [props.showPreview=true] - Whether to show text preview
 * @returns {JSX.Element}
 * 
 * @example
 * <ExtractedTextDisplay 
 *   extractedText={textData}
 *   onReset={handleReset}
 * />
 */
export function ExtractedTextDisplay({ 
  extractedText, 
  onReset, 
  showPreview = true 
}) {
  if (!extractedText) return null;

  const { content, pageCount, extractedAt } = extractedText;
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;

  /**
   * Format timestamp
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatTimestamp = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date(date));
  };

  /**
   * Get preview text
   * @returns {string} Truncated text for preview
   */
  const getPreviewText = () => {
    if (content.length <= PDF_CONFIG.MAX_TEXT_PREVIEW) {
      return content;
    }
    return content.substring(0, PDF_CONFIG.MAX_TEXT_PREVIEW) + '...';
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-green-500" />
            <Typography variant="h4" color="blue-gray">
              Texto Extraído com Sucesso!
            </Typography>
          </div>
          <Button
            onClick={onReset}
            variant="outlined"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Novo PDF
          </Button>
        </div>

        {/* Document statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Typography variant="h6" color="blue-gray">
              {pageCount}
            </Typography>
            <Typography variant="small" color="gray">
              Páginas
            </Typography>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Typography variant="h6" color="blue-gray">
              {wordCount.toLocaleString()}
            </Typography>
            <Typography variant="small" color="gray">
              Palavras
            </Typography>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Typography variant="h6" color="blue-gray">
              {charCount.toLocaleString()}
            </Typography>
            <Typography variant="small" color="gray">
              Caracteres
            </Typography>
          </div>
        </div>

        {/* Text preview */}
        {showPreview && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto">
            <Typography className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {getPreviewText()}
            </Typography>
          </div>
        )}

        {/* Metadata */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <Typography variant="small" color="gray">
            Extraído em: {formatTimestamp(extractedAt)}
          </Typography>
          {content.length > PDF_CONFIG.MAX_TEXT_PREVIEW && showPreview && (
            <Typography variant="small" color="gray">
              Mostrando {PDF_CONFIG.MAX_TEXT_PREVIEW} de {charCount} caracteres
            </Typography>
          )}
        </div>
      </CardBody>
    </Card>
  );
}