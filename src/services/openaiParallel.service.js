import OpenAI from 'openai';
import pLimit from 'p-limit';
import { ConfigService } from './config.service';

export class OpenAIParallelService {
  static openai = null;
  static defaultConcurrency = 8; // Based on OpenAI best practices for gpt-3.5-turbo
  static maxConcurrency = 20; // Safety limit
  static retryDelay = 1000;
  static maxRetries = 3;
  static requestsInFlight = 0;
  static totalRequests = 0;
  static completedRequests = 0;
  static failedRequests = 0;
  static startTime = null;
  static endTime = null;

  static async initialize() {
    const apiKey = ConfigService.getApiKey();
    if (!apiKey) {
      throw new Error('API key não configurada');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      maxRetries: 0 // We'll handle retries ourselves
    });
  }

  /**
   * Process multiple requests in parallel with optimal concurrency
   * @param {Array} requests - Array of request configurations
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Results in the same order as requests
   */
  static async processParallel(requests, options = {}) {
    if (!this.openai) {
      await this.initialize();
    }

    const {
      concurrency = this.defaultConcurrency,
      onProgress = null,
      onRequestComplete = null,
      onRequestError = null,
      maxRequestsPerMinute = 3500, // OpenAI Tier 1 default
      enableAdaptiveConcurrency = true
    } = options;

    // Validate concurrency
    const safeConcurrency = Math.min(
      Math.max(1, concurrency),
      this.maxConcurrency
    );

    // Create limiter
    const limit = pLimit(safeConcurrency);

    // Reset statistics
    this.resetStatistics();
    this.startTime = Date.now();
    this.totalRequests = requests.length;

    console.log(`🚀 Iniciando processamento paralelo de ${requests.length} requisições`);
    console.log(`⚡ Concorrência configurada: ${safeConcurrency}`);

    // RPM rate limiter
    const rpmLimiter = this.createRPMLimiter(maxRequestsPerMinute);

    // Process all requests
    const results = await Promise.all(
      requests.map((request, index) =>
        limit(async () => {
          // Wait for RPM limit if needed
          await rpmLimiter();

          // Track in-flight requests
          this.requestsInFlight++;

          try {
            const result = await this.executeRequestWithRetry(request, index);
            
            this.completedRequests++;
            
            if (onRequestComplete) {
              onRequestComplete({
                index,
                result,
                completed: this.completedRequests,
                total: this.totalRequests
              });
            }

            if (onProgress) {
              this.reportProgress(onProgress);
            }

            return { success: true, index, data: result };
          } catch (error) {
            this.failedRequests++;
            
            if (onRequestError) {
              onRequestError({
                index,
                error,
                request,
                completed: this.completedRequests,
                failed: this.failedRequests,
                total: this.totalRequests
              });
            }

            if (onProgress) {
              this.reportProgress(onProgress);
            }

            return { success: false, index, error: error.message, request };
          } finally {
            this.requestsInFlight--;
          }
        })
      )
    );

    this.endTime = Date.now();
    const summary = this.getProcessingSummary();
    
    console.log(`\n✅ Processamento concluído!`);
    console.log(`📊 Resumo:`);
    console.log(`   - Total: ${summary.totalRequests} requisições`);
    console.log(`   - Sucesso: ${summary.successfulRequests} (${summary.successRate}%)`);
    console.log(`   - Falhas: ${summary.failedRequests}`);
    console.log(`   - Tempo total: ${(summary.totalTime / 1000).toFixed(2)}s`);
    console.log(`   - Taxa média: ${summary.averageRequestsPerSecond.toFixed(2)} req/s`);

    return results;
  }

  /**
   * Execute a single request with retry logic
   */
  static async executeRequestWithRetry(request, index, retries = 0) {
    try {
      const response = await this.openai.chat.completions.create(request);
      return response;
    } catch (error) {
      // Handle rate limit errors with exponential backoff
      if (error.status === 429 && retries < this.maxRetries) {
        const delay = this.calculateBackoffDelay(retries);
        console.warn(`⚠️ Rate limit atingido na requisição ${index}. Aguardando ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeRequestWithRetry(request, index, retries + 1);
      }

      // Handle other retryable errors
      if (this.isRetryableError(error) && retries < this.maxRetries) {
        const delay = this.calculateBackoffDelay(retries);
        console.warn(`⚠️ Erro temporário na requisição ${index}. Tentativa ${retries + 1}/${this.maxRetries}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeRequestWithRetry(request, index, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Create a rate limiter for requests per minute
   */
  static createRPMLimiter(maxRequestsPerMinute) {
    const requests = [];
    const windowMs = 60000; // 1 minute in milliseconds

    return async () => {
      const now = Date.now();
      
      // Remove old requests outside the window
      while (requests.length > 0 && requests[0] < now - windowMs) {
        requests.shift();
      }

      // If we're at the limit, wait until the oldest request expires
      if (requests.length >= maxRequestsPerMinute) {
        const oldestRequest = requests[0];
        const waitTime = oldestRequest + windowMs - now + 100; // Add 100ms buffer
        
        if (waitTime > 0) {
          console.log(`⏳ Limite de RPM atingido. Aguardando ${(waitTime / 1000).toFixed(2)}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Clean up again after waiting
        while (requests.length > 0 && requests[0] < Date.now() - windowMs) {
          requests.shift();
        }
      }

      // Record this request
      requests.push(Date.now());
    };
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  static calculateBackoffDelay(retries) {
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retries);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 32000); // Cap at 32 seconds
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error) {
    const retryableStatuses = [500, 502, 503, 504];
    return retryableStatuses.includes(error.status) || 
           error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT';
  }

  /**
   * Report progress to callback
   */
  static reportProgress(onProgress) {
    const progress = {
      completed: this.completedRequests,
      failed: this.failedRequests,
      total: this.totalRequests,
      inFlight: this.requestsInFlight,
      percentage: ((this.completedRequests + this.failedRequests) / this.totalRequests * 100).toFixed(2),
      elapsedTime: Date.now() - this.startTime
    };

    onProgress(progress);
  }

  /**
   * Get processing summary
   */
  static getProcessingSummary() {
    const totalTime = this.endTime - this.startTime;
    const successfulRequests = this.completedRequests;
    
    return {
      totalRequests: this.totalRequests,
      successfulRequests,
      failedRequests: this.failedRequests,
      successRate: ((successfulRequests / this.totalRequests) * 100).toFixed(2),
      totalTime,
      averageTimePerRequest: totalTime / this.totalRequests,
      averageRequestsPerSecond: (this.totalRequests / (totalTime / 1000))
    };
  }

  /**
   * Reset statistics
   */
  static resetStatistics() {
    this.requestsInFlight = 0;
    this.totalRequests = 0;
    this.completedRequests = 0;
    this.failedRequests = 0;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Convenience method for text correction in parallel
   */
  static async correctTextsInParallel(texts, options = {}) {
    const systemPrompt = options.systemPrompt || `<role>
You are an AI text correction assistant specialized in fixing spacing issues in Portuguese text extracted from PDFs.
</role>

<task>
Your task is to correct spacing problems in the provided text, ensuring proper word separation and readability.
</task>

<instructions>
1. Add spaces between words that are incorrectly joined
2. Fix any spacing issues that affect readability
3. Preserve the original meaning and context
4. Maintain technical terms, URLs, emails, and numbers as they appear
5. Keep paragraph structure and line breaks
6. Return ONLY the corrected text without any introduction, explanation, or additional commentary
</instructions>

<output_format>
Provide ONLY the corrected text. Do not include:
- Introductory phrases like "Here is the corrected text:"
- Explanations of what was changed
- Any metadata or disclaimers
- Closing remarks

Just return the clean, corrected text.
</output_format>`;

    const requests = texts.map(text => ({
      model: options.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `<text_to_correct>\n${text}\n</text_to_correct>` }
      ],
      temperature: options.temperature || 0.0,
      max_tokens: Math.ceil(text.length * 1.5),
      top_p: 1.0,
      frequency_penalty: 0,
      presence_penalty: 0
    }));

    const results = await this.processParallel(requests, options);
    
    return results.map(result => {
      if (result.success) {
        return {
          success: true,
          text: result.data.choices[0].message.content.trim(),
          usage: result.data.usage
        };
      } else {
        return {
          success: false,
          error: result.error,
          originalText: texts[result.index]
        };
      }
    });
  }
}

export const createOpenAIParallelService = () => {
  return OpenAIParallelService;
};