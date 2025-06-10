/**
 * @fileoverview Chat interface component with audio recording capability
 */

import { useState } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Textarea,
  Spinner,
  IconButton,
} from '@material-tailwind/react';
import { SparklesIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { useOpenAI } from '../../hooks/useOpenAI';
import { useAudioRecording } from '../../hooks/useAudioRecording';

/**
 * ChatInterface component for interacting with ChatGPT
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.context] - PDF context for ChatGPT
 * @param {function} [props.onError] - Error callback
 * @returns {JSX.Element}
 * 
 * @example
 * <ChatInterface 
 *   context={extractedText?.content}
 *   onError={handleError}
 * />
 */
export function ChatInterface({ context = '', onError }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const { sendMessage, transcribeAudio, isLoading, isTranscribing, error, clearError } = useOpenAI(apiKey);
  
  const {
    startRecording,
    stopRecording,
    isRecording,
    isSupported: audioSupported,
    duration,
    formatDuration,
    error: audioError,
    clearError: clearAudioError
  } = useAudioRecording();

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    setResponse('');
    clearError();

    try {
      await sendMessage(prompt, context, (chunk) => {
        setResponse(chunk);
      });
    } catch (err) {
      console.error('Chat request failed:', err);
      if (onError) onError(err.message);
    }
  };

  /**
   * Handle audio recording start
   */
  const handleStartRecording = async () => {
    clearAudioError();
    
    await startRecording({
      onComplete: async (audioBlob) => {
        try {
          const transcription = await transcribeAudio(audioBlob);
          setPrompt(transcription);
        } catch (err) {
          console.error('Transcription failed:', err);
          if (onError) onError(err.message);
        }
      },
      onError: (err) => {
        console.error('Recording failed:', err);
        if (onError) onError(err.message);
      }
    });
  };

  /**
   * Handle prompt change
   * @param {Event} event - Input change event
   */
  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
    // Clear previous response when typing new prompt
    if (response && event.target.value !== prompt) {
      setResponse('');
    }
  };

  /**
   * Handle key press for submit
   * @param {KeyboardEvent} event - Key event
   */
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="h-6 w-6 text-blue-500" />
          <Typography variant="h5" color="blue-gray">
            Assistente ChatGPT
          </Typography>
        </div>
        
        {/* Response area with scroll */}
        {response && (
          <div className="mb-4 max-h-80 overflow-y-auto bg-blue-50 rounded-lg p-4">
            <Typography className="text-gray-800 whitespace-pre-wrap">
              {response}
            </Typography>
          </div>
        )}
        
        {/* Loading spinner */}
        {isLoading && (
          <div className="mb-4 flex justify-center">
            <Spinner className="h-8 w-8" color="blue" />
          </div>
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="mb-4 flex items-center justify-center gap-2 text-red-500">
            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            <Typography className="text-sm font-medium">
              Gravando... {formatDuration(duration)}
            </Typography>
          </div>
        )}
        
        {/* Error display */}
        {(error || audioError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Typography className="text-red-800 text-sm">
              {error || audioError}
            </Typography>
          </div>
        )}
        
        {/* Input section */}
        <div className="space-y-4">
          <Textarea
            label="Digite seu prompt"
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyPress}
            rows={4}
            className="!border-t-blue-gray-200 focus:!border-t-gray-900"
            labelProps={{
              className: "before:content-none after:content-none",
            }}
            placeholder="Ex: Resuma os principais pontos deste texto... (Ctrl+Enter para enviar)"
            disabled={isLoading || isTranscribing}
          />
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading || isTranscribing}
              className="flex-1 flex items-center justify-center gap-2"
              color="blue"
            >
              <SparklesIcon className="h-5 w-5" />
              Enviar para ChatGPT
            </Button>
            
            {/* Audio recording button */}
            {audioSupported && (
              !isRecording ? (
                <IconButton
                  onClick={handleStartRecording}
                  disabled={isLoading || isTranscribing}
                  color="blue"
                  variant="outlined"
                  className="shrink-0"
                  title="Gravar áudio"
                >
                  {isTranscribing ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <MicrophoneIcon className="h-5 w-5" />
                  )}
                </IconButton>
              ) : (
                <IconButton
                  onClick={stopRecording}
                  color="red"
                  className="shrink-0 animate-pulse"
                  title="Parar gravação"
                >
                  <StopIcon className="h-5 w-5" />
                </IconButton>
              )
            )}
          </div>
          
          {/* Help text */}
          <Typography variant="small" color="gray" className="text-center">
            Dica: Use Ctrl+Enter para enviar rapidamente
            {audioSupported && ' • Clique no microfone para gravar áudio'}
          </Typography>
        </div>
      </CardBody>
    </Card>
  );
}