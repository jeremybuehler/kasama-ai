/**
 * Semantic Cache System
 * 
 * Advanced caching system with semantic similarity matching for AI responses.
 * Reduces costs and improves response times through intelligent caching.
 */

import { CACHE_CONFIG } from '../constants';
import { AIResponse, AIRequest, AgentType, CacheEntry, CacheStats } from '../types';

export interface SemanticCacheConfig {
  maxSize: number;
  defaultTTL: number;
  similarityThreshold: number;
  embeddingDimensions: number;
  cleanupInterval: number;
  compressionEnabled: boolean;
}

export class SemanticCache {
  private cache = new Map<string, CacheEntry>();
  private embeddings = new Map<string, number[]>();
  private accessPattern = new Map<string, { count: number; lastAccessed: number }>();
  private config: SemanticCacheConfig;
  private cleanupInterval: NodeJS.Timeout;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  };

  constructor(config: Partial<SemanticCacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || CACHE_CONFIG.maxSize,
      defaultTTL: config.defaultTTL || CACHE_CONFIG.defaultTTL,
      similarityThreshold: config.similarityThreshold || CACHE_CONFIG.semanticSimilarityThreshold,
      embeddingDimensions: config.embeddingDimensions || CACHE_CONFIG.embeddingDimensions,
      cleanupInterval: config.cleanupInterval || CACHE_CONFIG.cleanupInterval,
      compressionEnabled: config.compressionEnabled ?? CACHE_CONFIG.compressionEnabled
    };

    this.startCleanupProcess();
  }

  /**
   * Get cached response if exists and is semantically similar
   */
  async get(request: AIRequest): Promise<AIResponse | null> {
    this.stats.totalRequests++;
    
    const cacheKey = this.generateCacheKey(request);
    const inputEmbedding = this.generateEmbedding(JSON.stringify(request.inputData));
    
    // Check for exact key match first
    const exactMatch = this.cache.get(cacheKey);
    if (exactMatch && this.isValid(exactMatch)) {
      this.updateAccessPattern(cacheKey);
      this.stats.hits++;
      return { ...exactMatch.value, cacheHit: true };
    }

    // Check for semantic similarity matches
    const semanticMatch = await this.findSemanticMatch(request.agentType, inputEmbedding);
    if (semanticMatch) {
      this.updateAccessPattern(semanticMatch.key);
      this.stats.hits++;
      return { ...semanticMatch.value, cacheHit: true };
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Store response in cache with semantic indexing
   */
  async set(request: AIRequest, response: AIResponse, customTTL?: number): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    const inputEmbedding = this.generateEmbedding(JSON.stringify(request.inputData));
    const ttl = customTTL || this.config.defaultTTL;
    
    // Ensure cache doesn't exceed max size
    await this.ensureCapacity();

    const cacheEntry: CacheEntry = {
      key: cacheKey,
      value: { ...response, cacheHit: false },
      embedding: inputEmbedding,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      ttl
    };

    this.cache.set(cacheKey, cacheEntry);
    this.embeddings.set(cacheKey, inputEmbedding);
    this.accessPattern.set(cacheKey, { count: 1, lastAccessed: Date.now() });
  }

  /**
   * Invalidate cache entries for specific user or agent type
   */
  invalidate(filters: { userId?: string; agentType?: AgentType; pattern?: string }): number {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      let shouldInvalidate = false;
      
      if (filters.userId && key.includes(filters.userId)) {
        shouldInvalidate = true;
      }
      
      if (filters.agentType && key.includes(filters.agentType)) {
        shouldInvalidate = true;
      }
      
      if (filters.pattern && key.includes(filters.pattern)) {
        shouldInvalidate = true;
      }
      
      if (shouldInvalidate) {
        this.cache.delete(key);
        this.embeddings.delete(key);
        this.accessPattern.delete(key);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
      missRate: this.stats.totalRequests > 0 ? this.stats.misses / this.stats.totalRequests : 0,
      evictionCount: this.stats.evictions,
      oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.timestamp))) : null,
      newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.timestamp))) : null
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.embeddings.clear();
    this.accessPattern.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
  }

  /**
   * Get cache efficiency metrics
   */
  getEfficiencyMetrics(): {
    hitRate: number;
    avgAccessCount: number;
    memoryUsage: number;
    costSavings: number;
  } {
    const stats = this.getStats();
    const entries = Array.from(this.cache.values());
    const accessCounts = Array.from(this.accessPattern.values()).map(p => p.count);
    
    // Estimate memory usage (rough approximation)
    const memoryUsage = entries.reduce((total, entry) => {
      return total + 
        JSON.stringify(entry.value).length + 
        (entry.embedding?.length || 0) * 4; // 4 bytes per float
    }, 0);

    // Estimate cost savings based on cache hits
    const avgTokensPerRequest = 500; // Rough estimate
    const avgCostPerToken = 0.000003; // Claude cost estimate
    const costSavings = this.stats.hits * avgTokensPerRequest * avgCostPerToken;

    return {
      hitRate: stats.hitRate,
      avgAccessCount: accessCounts.length > 0 ? accessCounts.reduce((a, b) => a + b, 0) / accessCounts.length : 0,
      memoryUsage: Math.round(memoryUsage / 1024), // KB
      costSavings
    };
  }

  private generateCacheKey(request: AIRequest): string {
    // Create a deterministic key based on user, agent type, and input hash
    const inputHash = this.hashString(JSON.stringify(request.inputData));
    return `${request.userId}:${request.agentType}:${inputHash}`;
  }

  private generateEmbedding(text: string): number[] {
    // Simple embedding generation for semantic similarity
    // In production, consider using a proper embedding service
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const embedding = new Array(this.config.embeddingDimensions).fill(0);
    
    // Use word hashing to create a sparse vector
    words.forEach((word, index) => {
      const hash = this.hashString(word);
      const position = Math.abs(hash) % this.config.embeddingDimensions;
      embedding[position] += 1 / Math.sqrt(words.length); // TF-IDF-like weighting
    });
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  private async findSemanticMatch(agentType: AgentType, inputEmbedding: number[]): Promise<CacheEntry | null> {
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Only compare entries from the same agent type
      if (!key.includes(agentType)) continue;
      
      // Skip expired entries
      if (!this.isValid(entry)) continue;
      
      const similarity = this.cosineSimilarity(inputEmbedding, entry.embedding || []);
      
      if (similarity > this.config.similarityThreshold && similarity > bestSimilarity) {
        bestMatch = entry;
        bestSimilarity = similarity;
      }
    }
    
    return bestMatch;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  private updateAccessPattern(key: string): void {
    const pattern = this.accessPattern.get(key);
    if (pattern) {
      pattern.count++;
      pattern.lastAccessed = Date.now();
    }
  }

  private async ensureCapacity(): Promise<void> {
    if (this.cache.size < this.config.maxSize) return;
    
    // Calculate how many entries to evict (10% of max size)
    const evictCount = Math.max(1, Math.floor(this.config.maxSize * 0.1));
    
    // Get entries sorted by eviction priority (LRU + access frequency)
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      const pattern = this.accessPattern.get(key) || { count: 0, lastAccessed: 0 };
      const score = this.calculateEvictionScore(entry, pattern);
      return { key, entry, score };
    });
    
    // Sort by eviction score (higher score = more likely to evict)
    entries.sort((a, b) => b.score - a.score);
    
    // Evict entries with highest scores
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      const key = entries[i].key;
      this.cache.delete(key);
      this.embeddings.delete(key);
      this.accessPattern.delete(key);
      this.stats.evictions++;
    }
  }

  private calculateEvictionScore(entry: CacheEntry, pattern: { count: number; lastAccessed: number }): number {
    const now = Date.now();
    const age = now - entry.timestamp;
    const timeSinceLastAccess = now - pattern.lastAccessed;
    const accessFrequency = pattern.count;
    
    // Higher score means more likely to evict
    // Factors: age, time since last access, low access frequency
    const ageScore = age / entry.ttl; // 0-1+ (expired entries get >1)
    const accessScore = Math.max(0, 1 - (accessFrequency / 10)); // Less frequently accessed = higher score
    const recencyScore = timeSinceLastAccess / (24 * 60 * 60 * 1000); // Days since last access
    
    return ageScore + accessScore + recencyScore;
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        this.embeddings.delete(key);
        this.accessPattern.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }
    
    // Log cache stats periodically
    const stats = this.getStats();
    if (this.stats.totalRequests > 0 && this.stats.totalRequests % 100 === 0) {
      console.log('Cache Stats:', {
        hitRate: Math.round(stats.hitRate * 100) + '%',
        size: stats.size,
        evictions: this.stats.evictions
      });
    }
  }

  /**
   * Warm up cache with common patterns (optional)
   */
  async warmup(commonPatterns: Array<{ agentType: AgentType; inputData: unknown; response: AIResponse }>): Promise<void> {
    console.log(`Warming up cache with ${commonPatterns.length} patterns...`);
    
    for (const pattern of commonPatterns) {
      const mockRequest: AIRequest = {
        id: 'warmup',
        userId: 'system',
        agentType: pattern.agentType,
        inputData: pattern.inputData,
        priority: 'low'
      };
      
      await this.set(mockRequest, pattern.response, 24 * 60 * 60 * 1000); // 24 hour TTL
    }
    
    console.log('Cache warmup complete');
  }

  /**
   * Export cache data for persistence
   */
  export(): string {
    const data = {
      cache: Array.from(this.cache.entries()),
      embeddings: Array.from(this.embeddings.entries()),
      accessPattern: Array.from(this.accessPattern.entries()),
      stats: this.stats,
      timestamp: Date.now()
    };
    
    return JSON.stringify(data);
  }

  /**
   * Import cache data from persistence
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      // Validate data structure
      if (!parsed.cache || !Array.isArray(parsed.cache)) {
        throw new Error('Invalid cache data structure');
      }
      
      // Clear existing cache
      this.clear();
      
      // Import data
      this.cache = new Map(parsed.cache);
      this.embeddings = new Map(parsed.embeddings || []);
      this.accessPattern = new Map(parsed.accessPattern || []);
      this.stats = parsed.stats || { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
      
      console.log(`Imported ${this.cache.size} cache entries`);
      
    } catch (error) {
      console.error('Failed to import cache data:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}