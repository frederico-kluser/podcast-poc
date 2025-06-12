export class CorrectionMetrics {
  constructor() {
    this.metrics = [];
    this.summary = {
      totalProcessed: 0,
      totalSpacesAdded: 0,
      totalProcessingTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageAccuracy: 0,
      errors: []
    };
  }

  track(original, corrected, processingTime, error = null) {
    const metric = {
      timestamp: new Date().toISOString(),
      originalLength: original.length,
      correctedLength: corrected.length,
      spacesAdded: this.countSpacesAdded(original, corrected),
      processingTime: processingTime,
      tokensUsed: Math.ceil((original.length + corrected.length) / 3),
      estimatedCost: this.calculateCost(original.length, corrected.length),
      compressionRatio: corrected.length / original.length,
      error: error
    };

    // Calculate quality metrics
    metric.qualityScore = this.calculateQualityScore(original, corrected);
    metric.improvements = this.identifyImprovements(original, corrected);

    this.metrics.push(metric);
    this.updateSummary(metric);

    console.log('📊 Métricas de correção:', {
      spacesAdded: metric.spacesAdded,
      processingTime: `${metric.processingTime}ms`,
      tokensUsed: metric.tokensUsed,
      cost: `$${metric.estimatedCost.toFixed(4)}`,
      qualityScore: `${(metric.qualityScore * 100).toFixed(1)}%`
    });

    return metric;
  }

  countSpacesAdded(original, corrected) {
    const originalSpaces = (original.match(/ /g) || []).length;
    const correctedSpaces = (corrected.match(/ /g) || []).length;
    return correctedSpaces - originalSpaces;
  }

  calculateCost(originalLength, correctedLength) {
    // GPT-4o-mini pricing
    const inputTokens = Math.ceil(originalLength / 3);
    const outputTokens = Math.ceil(correctedLength / 3);
    const inputCost = (inputTokens / 1_000_000) * 0.15;
    const outputCost = (outputTokens / 1_000_000) * 0.60;
    return inputCost + outputCost;
  }

  calculateQualityScore(original, corrected) {
    // Simple quality score based on improvements
    let score = 0.5; // Base score

    // Check if spaces were added appropriately
    const spacesAdded = this.countSpacesAdded(original, corrected);
    if (spacesAdded > 0) {
      score += 0.2;
    }

    // Check if text maintains reasonable length
    const lengthRatio = corrected.length / original.length;
    if (lengthRatio >= 1.0 && lengthRatio <= 1.3) {
      score += 0.2;
    }

    // Check word separation improvements
    const originalWords = original.split(/\s+/).length;
    const correctedWords = corrected.split(/\s+/).length;
    if (correctedWords > originalWords) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  identifyImprovements(original, corrected) {
    const improvements = [];

    // Count word separations
    const originalWords = original.split(/\s+/).filter(w => w.length > 0);
    const correctedWords = corrected.split(/\s+/).filter(w => w.length > 0);

    if (correctedWords.length > originalWords.length) {
      improvements.push({
        type: 'word_separation',
        count: correctedWords.length - originalWords.length,
        description: `Separated ${correctedWords.length - originalWords.length} joined words`
      });
    }

    // Check for common patterns fixed
    const patterns = [
      { regex: /[a-z][A-Z]/g, name: 'camelCase_separation' },
      { regex: /\d[a-z]/g, name: 'number_letter_separation' },
      { regex: /[.!?][A-Z]/g, name: 'sentence_boundary_fix' }
    ];

    patterns.forEach(pattern => {
      const originalMatches = (original.match(pattern.regex) || []).length;
      const correctedMatches = (corrected.match(pattern.regex) || []).length;
      
      if (correctedMatches < originalMatches) {
        improvements.push({
          type: pattern.name,
          count: originalMatches - correctedMatches,
          description: `Fixed ${originalMatches - correctedMatches} ${pattern.name} issues`
        });
      }
    });

    return improvements;
  }

  updateSummary(metric) {
    this.summary.totalProcessed++;
    this.summary.totalSpacesAdded += metric.spacesAdded;
    this.summary.totalProcessingTime += metric.processingTime;
    this.summary.totalTokensUsed += metric.tokensUsed;
    this.summary.totalCost += metric.estimatedCost;

    if (metric.error) {
      this.summary.errors.push({
        timestamp: metric.timestamp,
        error: metric.error
      });
    }

    // Calculate average accuracy
    const qualityScores = this.metrics
      .filter(m => !m.error)
      .map(m => m.qualityScore);
    
    if (qualityScores.length > 0) {
      this.summary.averageAccuracy = 
        qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    }
  }

  getSummary() {
    return {
      ...this.summary,
      averageProcessingTime: this.summary.totalProcessed > 0 
        ? this.summary.totalProcessingTime / this.summary.totalProcessed 
        : 0,
      averageSpacesPerChunk: this.summary.totalProcessed > 0
        ? this.summary.totalSpacesAdded / this.summary.totalProcessed
        : 0,
      errorRate: this.summary.totalProcessed > 0
        ? this.summary.errors.length / this.summary.totalProcessed
        : 0
    };
  }

  exportMetrics() {
    return {
      summary: this.getSummary(),
      details: this.metrics,
      exportedAt: new Date().toISOString()
    };
  }

  reset() {
    this.metrics = [];
    this.summary = {
      totalProcessed: 0,
      totalSpacesAdded: 0,
      totalProcessingTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageAccuracy: 0,
      errors: []
    };
  }
}

export const createCorrectionMetrics = () => {
  return new CorrectionMetrics();
};