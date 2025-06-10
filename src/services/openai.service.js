/**
 * @fileoverview OpenAI API service layer
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { OPENAI_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '../constants';

/**
 * OpenAI service class for handling chat and transcription requests
 */
export class OpenAIService {
  /**
   * @param {string} apiKey - OpenAI API key
   */
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.chatModel = null;
  }

  /**
   * Initialize the chat model
   * @private
   */
  _initChatModel() {
    if (!this.chatModel) {
      this.chatModel = new ChatOpenAI({
        openAIApiKey: this.apiKey,
        modelName: OPENAI_CONFIG.CHAT_MODEL,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        streaming: true,
      });
    }
    return this.chatModel;
  }

  /**
   * Send a chat message with streaming response
   * @param {string} prompt - User prompt
   * @param {string} context - PDF context text
   * @param {function} onChunk - Callback for each response chunk
   * @returns {Promise<string>} Complete response text
   * @throws {Error} When chat request fails
   */
  async sendChatMessage(prompt, context = '', onChunk) {
    try {
      const model = this._initChatModel();
      
      const messages = [
        new SystemMessage(
          context 
            ? `Você é um assistente útil. Aqui está o contexto do documento PDF extraído:\n\n${context.substring(0, OPENAI_CONFIG.MAX_CONTEXT_LENGTH)}...`
            : 'Você é um assistente útil.'
        ),
        new HumanMessage(prompt)
      ];

      const stream = await model.stream(messages);
      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.content;
        if (typeof content === 'string') {
          fullResponse += content;
          if (onChunk) {
            onChunk(fullResponse);
          }
        }
      }
      
      return fullResponse;
    } catch (error) {
      console.error('Chat request failed:', error);
      throw new Error(ERROR_MESSAGES.CHAT_REQUEST_FAILED);
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   * @param {Blob} audioBlob - Audio data to transcribe
   * @param {string} language - Language code (default: 'pt')
   * @returns {Promise<string>} Transcribed text
   * @throws {Error} When transcription fails
   */
  async transcribeAudio(audioBlob, language = 'pt') {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', OPENAI_CONFIG.WHISPER_MODEL);
      formData.append('language', language);

      const response = await fetch(API_ENDPOINTS.OPENAI_TRANSCRIPTIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error(ERROR_MESSAGES.TRANSCRIPTION_FAILED);
    }
  }
}

/**
 * Create OpenAI service instance
 * @param {string} apiKey - OpenAI API key
 * @returns {OpenAIService} Service instance
 */
export const createOpenAIService = (apiKey) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  return new OpenAIService(apiKey);
};