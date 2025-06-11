/**
 * @fileoverview LRU cache implementation for embeddings
 */

/**
 * LRU (Least Recently Used) cache for storing embeddings
 */
export class EmbeddingCache {
  /**
   * @param {number} maxSize - Maximum number of items to store
   */
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key) {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recent)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    // Remove existing entry
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number}
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Generate cache key from text
   * @param {string} text - Text to hash
   * @returns {string} Cache key
   */
  static generateKey(text) {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}

// Singleton instance
let cacheInstance = null;

/**
 * Get or create cache instance
 * @param {number} maxSize - Maximum cache size
 * @returns {EmbeddingCache}
 */
export const getEmbeddingCache = (maxSize = 1000) => {
  if (!cacheInstance) {
    cacheInstance = new EmbeddingCache(maxSize);
  }
  return cacheInstance;
};