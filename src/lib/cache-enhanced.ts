/**
 * Enhanced Caching System for Kasama AI
 * Semantic caching for AI responses with intelligent invalidation
 * Targets 85%+ cache hit rate for cost optimization
 */

import { clsx } from 'clsx';

// Cache configuration
const CACHE_CONFIG = {
  // AI Response caching
  AI_RESPONSE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  SEMANTIC_SIMILARITY_THRESHOLD: 0.85, // 85% similarity for cache hits
  
  // Query caching  
  QUERY_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  USER_DATA_TTL: 30 * 60 * 1000, // 30 minutes
  
  // Performance settings
  MAX_CACHE_SIZE: 1000, // Maximum cached items
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour cleanup cycle
} as const;

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  metadata?: {
    userId?: string;
    type?: 'ai_response' | 'query' | 'user_data';
    semanticHash?: string;
    cost?: number;
  };
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  memoryUsage: number;
  costSavings: number;
}

class EnhancedCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    memoryUsage: 0,
    costSavings: 0,
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Get cached value with semantic similarity check for AI responses
   */
  async get<T>(key: string, options?: {
    semanticCheck?: boolean;
    userId?: string;
  }): Promise<T | null> {
    // Direct cache hit
    const entry = this.cache.get(key);
    if (entry && !this.isExpired(entry)) {
      this.recordHit(entry);
      return entry.value as T;
    }

    // Semantic similarity check for AI responses
    if (options?.semanticCheck) {
      const similarEntry = await this.findSemanticallySimilar(key, options.userId);
      if (similarEntry) {
        this.recordHit(similarEntry);
        return similarEntry.value as T;
      }
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set cached value with metadata
   */
  set<T>(key: string, value: T, options?: {
    ttl?: number;
    userId?: string;
    type?: 'ai_response' | 'query' | 'user_data';
    cost?: number;
    semanticHash?: string;
  }): void {
    const ttl = options?.ttl ?? CACHE_CONFIG.QUERY_CACHE_TTL;
    const now = Date.now();

    const entry: CacheEntry = {
      key,
      value,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      metadata: {
        userId: options?.userId,
        type: options?.type ?? 'query',
        semanticHash: options?.semanticHash,
        cost: options?.cost ?? 0,
      },
    };

    this.cache.set(key, entry);
    this.enforceMaxSize();
    this.updateStats();
  }

  /**
   * Specialized method for caching AI responses with semantic hashing
   */
  async cacheAIResponse(
    prompt: string,
    response: any,
    userId: string,
    cost: number = 0
  ): Promise<void> {
    const semanticHash = await this.generateSemanticHash(prompt);
    const key = `ai_${userId}_${semanticHash}`;

    this.set(key, response, {
      ttl: CACHE_CONFIG.AI_RESPONSE_TTL,
      userId,
      type: 'ai_response',
      cost,
      semanticHash,
    });

    // Track cost savings
    this.stats.costSavings += cost;
  }

  /**
   * Get AI response with semantic matching
   */
  async getAIResponse(
    prompt: string,
    userId: string
  ): Promise<{ response: any; cached: boolean } | null> {
    const semanticHash = await this.generateSemanticHash(prompt);
    const key = `ai_${userId}_${semanticHash}`;

    const cached = await this.get(key, {
      semanticCheck: true,
      userId,
    });

    if (cached) {
      return { response: cached, cached: true };
    }

    return null;
  }

  /**
   * Find semantically similar cached entries
   */
  private async findSemanticallysimilar(
    targetKey: string,
    userId?: string
  ): Promise<CacheEntry | null> {
    const targetHash = await this.generateSemanticHash(targetKey);

    for (const [, entry] of this.cache) {
      if (
        entry.metadata?.type === 'ai_response' &&
        entry.metadata?.userId === userId &&
        entry.metadata?.semanticHash
      ) {
        const similarity = await this.calculateSimilarity(
          targetHash,
          entry.metadata.semanticHash
        );

        if (similarity >= CACHE_CONFIG.SEMANTIC_SIMILARITY_THRESHOLD) {
          return entry;
        }
      }
    }

    return null;
  }

  /**
   * Generate semantic hash for text similarity
   */
  private async generateSemanticHash(text: string): Promise<string> {
    // Simplified semantic hashing - normalize and create hash
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Simple hash function (in production, use more sophisticated embedding)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate text similarity (simplified)
   */
  private async calculateSimilarity(hash1: string, hash2: string): Promise<number> {
    if (hash1 === hash2) return 1;

    // Simple Levenshtein-based similarity
    const len1 = hash1.length;
    const len2 = hash2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(hash1, hash2);
    return (maxLen - distance) / maxLen;
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  /**
   * Record cache hit and update access patterns
   */
  private recordHit(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    if (entry.metadata?.cost) {
      this.stats.costSavings += entry.metadata.cost;
    }
    
    this.updateHitRate();
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Enforce maximum cache size using LRU strategy
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= CACHE_CONFIG.MAX_CACHE_SIZE) return;

    // Sort by last accessed time (LRU)
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    // Remove oldest 20% of entries
    const toRemove = Math.floor(this.cache.size * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache) {
      // Rough estimation: string length * 2 (UTF-16) + object overhead
      totalSize += key.length * 2;
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 200; // Object overhead estimate
    }

    return totalSize;
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cache cleanup: removed ${removedCount} expired entries`);
      this.updateStats();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear specific user's cache
   */
  clearUserCache(userId: string): void {
    let removedCount = 0;

    for (const [key, entry] of this.cache) {
      if (entry.metadata?.userId === userId) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    console.log(`Cleared ${removedCount} entries for user ${userId}`);
    this.updateStats();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      memoryUsage: 0,
      costSavings: 0,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Global cache instance
export const enhancedCache = new EnhancedCache();

// React hook for cache statistics
export function useCacheStats() {
  const [stats, setStats] = React.useState(enhancedCache.getStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(enhancedCache.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

// Utility functions
export const CacheUtils = {
  /**
   * Generate cache key for user-specific data
   */
  userKey: (userId: string, type: string, ...params: string[]): string => {
    return `user_${userId}_${type}_${params.join('_')}`;
  },

  /**
   * Generate cache key for assessment data
   */
  assessmentKey: (userId: string, assessmentId: string): string => {
    return `assessment_${userId}_${assessmentId}`;
  },

  /**
   * Generate cache key for AI insights
   */
  insightKey: (userId: string, insightType: string): string => {
    return `insight_${userId}_${insightType}`;
  },

  /**
   * Check if cache hit rate is healthy
   */
  isHealthy: (): boolean => {
    const stats = enhancedCache.getStats();
    return stats.hitRate >= 70; // Target 70%+ hit rate
  },

  /**
   * Get cache performance summary
   */
  getPerformanceSummary: () => {
    const stats = enhancedCache.getStats();
    return {
      ...stats,
      efficiency: stats.hitRate >= 85 ? 'Excellent' : 
                 stats.hitRate >= 70 ? 'Good' : 
                 stats.hitRate >= 50 ? 'Fair' : 'Poor',
      costSavingsFormatted: `$${(stats.costSavings / 100).toFixed(2)}`,
      memoryUsageFormatted: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
    };
  },
};

// React import for the hook
import React from 'react';

export default enhancedCache;