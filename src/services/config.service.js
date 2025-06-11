export class ConfigService {
  static API_KEY_STORAGE = 'openai_api_key';
  static INDEX_METADATA_STORAGE = 'rag_index_metadata';
  
  // API Key Management
  static saveApiKey(apiKey) {
    sessionStorage.setItem(this.API_KEY_STORAGE, apiKey);
  }
  
  static getApiKey() {
    return sessionStorage.getItem(this.API_KEY_STORAGE);
  }
  
  static hasApiKey() {
    return !!this.getApiKey();
  }
  
  static clearApiKey() {
    sessionStorage.removeItem(this.API_KEY_STORAGE);
  }
  
  static validateApiKey(apiKey) {
    return apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;
  }
  
  // Index Metadata Management
  static saveIndexMetadata(metadata) {
    localStorage.setItem(this.INDEX_METADATA_STORAGE, JSON.stringify(metadata));
  }
  
  static getIndexMetadata() {
    const data = localStorage.getItem(this.INDEX_METADATA_STORAGE);
    return data ? JSON.parse(data) : null;
  }
  
  static clearIndexMetadata() {
    localStorage.removeItem(this.INDEX_METADATA_STORAGE);
  }
  
  // Available Indexes
  static getAvailableIndexes() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('rag_index_'));
    return keys.map(key => {
      const data = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(data);
        return parsed.metadata;
      } catch {
        return null;
      }
    }).filter(Boolean);
  }
}