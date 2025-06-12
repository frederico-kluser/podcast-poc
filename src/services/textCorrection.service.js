import OpenAI from 'openai';
import { ConfigService } from './config.service';
import { createCorrectionMetrics } from '../utils/correctionMetrics';

export class TextCorrectionService {
  static openai = null;
  static model = 'gpt-4o-mini';
  static temperature = 0.0;
  static maxRetries = 3;
  static retryDelay = 1000;
  static correctionCache = new Map();
  static maxCacheSize = 1000;
  static metrics = createCorrectionMetrics();

  static async initialize() {
    const apiKey = ConfigService.getApiKey();
    if (!apiKey) {
      throw new Error('API key não configurada');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  static async correctSpacing(text, options = {}) {
    if (!this.openai) {
      await this.initialize();
    }

    const {
      validateOutput = true
    } = options;

    // Check cache first
    const textHash = this.generateHash(text);
    if (this.correctionCache.has(textHash)) {
      console.log('✅ Correção encontrada no cache');
      return this.correctionCache.get(textHash);
    }

    const startTime = Date.now();

    const systemPrompt = `You are a text spacing correction assistant. Your ONLY task is to add missing spaces between words in Portuguese text extracted from PDFs.

CRITICAL RULES:
- Only add spaces between words that are incorrectly joined
- Do not change any letters, words, punctuation, or formatting
- Do not correct spelling or grammar
- Preserve all original characters exactly as they appear
- Maintain technical terms, URLs, emails, and numbers intact
- Keep paragraph breaks and line breaks as in the original

Examples:
Input: "Esteéumtextocomespaçosfaltando"
Output: "Este é um texto com espaços faltando"

Input: "Apáginacontém3exemplos"
Output: "A página contém 3 exemplos"`;

    const userPrompt = `Fix the spacing in this text:\n\n${text}`;

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: this.temperature,
          max_tokens: Math.ceil(text.length * 1.2),
          top_p: 1.0,
          frequency_penalty: 0,
          presence_penalty: 0
        });
      });

      const correctedText = response.choices[0].message.content;

      // Validate if output is valid
      if (validateOutput) {
        this.validateCorrection(text, correctedText);
      }

      // Add to cache
      this.addToCache(textHash, correctedText);

      // Track metrics
      const processingTime = Date.now() - startTime;
      this.metrics.track(text, correctedText, processingTime);

      return correctedText;
    } catch (error) {
      console.error('Erro na correção de texto:', error);
      
      // Track error in metrics
      const processingTime = Date.now() - startTime;
      this.metrics.track(text, text, processingTime, error.message);
      
      throw error;
    }
  }

  static async correctInBatches(chunks, onProgress) {
    const results = [];
    const batchSize = 5;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      const batchPromises = batch.map(chunk => 
        this.correctSpacing(chunk.text)
          .then(corrected => ({ ...chunk, text: corrected }))
          .catch(error => ({ ...chunk, text: chunk.text, error }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (onProgress) {
        onProgress({
          current: Math.min(i + batchSize, chunks.length),
          total: chunks.length,
          percentage: Math.min(((i + batchSize) / chunks.length) * 100, 100)
        });
      }

      // Rate limiting between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  static validateCorrection(original, corrected) {
    const originalNoSpaces = original.replace(/\s/g, '');
    const correctedNoSpaces = corrected.replace(/\s/g, '');

    if (originalNoSpaces !== correctedNoSpaces) {
      console.warn('Validação falhou: conteúdo foi alterado além de espaços');
      throw new Error('Correção inválida: conteúdo foi alterado');
    }
  }

  static async retryWithBackoff(fn, retries = 0) {
    try {
      return await fn();
    } catch (error) {
      if (retries < this.maxRetries && error.status === 429) {
        const delay = this.retryDelay * Math.pow(2, retries) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, retries + 1);
      }
      throw error;
    }
  }

  static generateHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  static addToCache(hash, correctedText) {
    if (this.correctionCache.size >= this.maxCacheSize) {
      const firstKey = this.correctionCache.keys().next().value;
      this.correctionCache.delete(firstKey);
    }
    this.correctionCache.set(hash, correctedText);
  }

  static estimateCost(textLength, chunks) {
    const estimatedInputTokens = Math.ceil(textLength / 3);
    const estimatedOutputTokens = estimatedInputTokens * 1.1;
    
    const inputCost = (estimatedInputTokens / 1_000_000) * 0.15;
    const outputCost = (estimatedOutputTokens / 1_000_000) * 0.60;
    
    return {
      estimatedInputTokens,
      estimatedOutputTokens,
      totalCost: inputCost + outputCost,
      costPerChunk: (inputCost + outputCost) / chunks
    };
  }

  static getMetricsSummary() {
    return this.metrics.getSummary();
  }

  static exportMetrics() {
    return this.metrics.exportMetrics();
  }

  static resetMetrics() {
    this.metrics.reset();
  }
}

export const createTextCorrectionService = () => {
  return TextCorrectionService;
};