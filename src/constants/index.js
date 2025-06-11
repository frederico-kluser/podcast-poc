/**
 * @fileoverview Application constants
 */

/**
 * OpenAI API configuration
 */
export const OPENAI_CONFIG = {
  CHAT_MODEL: 'gpt-4-turbo-preview',
  WHISPER_MODEL: 'whisper-1',
  TEMPERATURE: 0,
  MAX_TOKENS: 4000,
};

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  OPENAI_CHAT: 'https://api.openai.com/v1/chat/completions',
  OPENAI_TRANSCRIPTIONS: 'https://api.openai.com/v1/audio/transcriptions',
};

/**
 * PDF processing configuration
 */
export const PDF_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['application/pdf'],
  MAX_TEXT_PREVIEW: 1000,
  MAX_CONTEXT_LENGTH: 3000,
};

/**
 * Audio recording configuration
 */
export const AUDIO_CONFIG = {
  AUDIO_TYPE: 'audio/webm',
  CONSTRAINTS: {
    audio: {
      channelCount: 1,
      sampleRate: 16000,
    },
  },
  MAX_RECORDING_TIME: 5 * 60 * 1000, // 5 minutes
};

/**
 * UI constants
 */
export const UI_CONFIG = {
  MAX_RESPONSE_HEIGHT: 'max-h-80',
  SPINNER_SIZE: 'h-8 w-8',
  ANIMATION_DURATION: 300,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  PDF_PROCESSING: 'Erro ao processar PDF. Verifique se o arquivo é válido.',
  MICROPHONE_ACCESS: 'Erro ao acessar o microfone. Verifique as permissões.',
  TRANSCRIPTION_FAILED: 'Erro ao transcrever o áudio. Tente novamente.',
  CHAT_REQUEST_FAILED: 'Erro ao processar sua solicitação. Tente novamente.',
  FILE_TOO_LARGE: 'Arquivo muito grande. Tamanho máximo permitido: 10MB.',
  INVALID_FILE_TYPE: 'Tipo de arquivo não suportado. Apenas PDFs são aceitos.',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  PDF_UPLOADED: 'PDF carregado com sucesso!',
  TRANSCRIPTION_COMPLETED: 'Transcrição concluída com sucesso!',
};