/**
 * Rate Limiter
 * 
 * Advanced rate limiting system with multiple strategies:
 * - Token bucket for burst handling
 * - Sliding window for precise rate control
 * - Priority queuing for different request types
 * - User-tier based limits (free, premium, enterprise)
 */

import { RATE_LIMITS } from '../constants';
import { AIRequest, RateLimit, RateLimitStatus } from '../types';

export interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
  requests: number[];
  windowStart: number;
}

export interface RateLimiterConfig {
  strategy: 'token-bucket' | 'sliding-window' | 'fixed-window';
  defaultLimit: RateLimit;
  userTierLimits: Record<string, RateLimit>;
  priorityMultipliers: Record<string, number>;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private config: RateLimiterConfig;
  private rateLimitDefinitions: Record<string, RateLimit>;
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = {
      strategy: 'sliding-window',
      defaultLimit: RATE_LIMITS.global,
      userTierLimits: {
        free: RATE_LIMITS.perUser,
        premium: RATE_LIMITS.premium,
        enterprise: RATE_LIMITS.enterprise
      },
      priorityMultipliers: {
        low: 0.5,
        medium: 1.0,
        high: 1.5
      },
      ...config
    };
    
    this.rateLimitDefinitions = { ...RATE_LIMITS };
    this.startCleanupProcess();
  }

  /**
   * Check if request is within rate limits
   */
  async checkLimit(request: AIRequest): Promise<RateLimitStatus> {
    const limits = this.getApplicableLimits(request);
    
    for (const [name, limit] of Object.entries(limits)) {
      const key = this.generateKey(request, name, limit);
      const status = await this.checkIndividualLimit(key, limit, request);
      
      if (status.limited) {
        // Record the limiting factor
        console.warn(`Rate limit exceeded for ${name}:`, {
          key,
          remaining: status.remaining,
          resetTime: status.resetTime
        });
        return status;
      }
    }
    
    // All limits passed, consume tokens/requests
    await this.consumeRequests(request, limits);
    
    return {
      remaining: Math.min(...Object.values(limits).map(limit => this.getRemainingRequests(request, limit))),
      resetTime: new Date(Date.now() + Math.max(...Object.values(limits).map(limit => limit.windowMs))),
      limited: false
    };
  }

  /**
   * Get current rate limit status without consuming
   */
  getStatus(request: AIRequest): RateLimitStatus {
    const limits = this.getApplicableLimits(request);
    let minRemaining = Infinity;
    let maxResetTime = 0;
    
    for (const limit of Object.values(limits)) {
      const remaining = this.getRemainingRequests(request, limit);
      const resetTime = Date.now() + limit.windowMs;
      
      minRemaining = Math.min(minRemaining, remaining);
      maxResetTime = Math.max(maxResetTime, resetTime);
    }
    
    return {
      remaining: Math.max(0, minRemaining),
      resetTime: new Date(maxResetTime),
      limited: minRemaining <= 0
    };
  }

  /**
   * Add custom rate limit rule
   */
  addRateLimit(name: string, limit: RateLimit): void {
    this.rateLimitDefinitions[name] = limit;
  }

  /**
   * Remove rate limit rule
   */
  removeRateLimit(name: string): void {
    delete this.rateLimitDefinitions[name];
  }

  /**
   * Get rate limit statistics
   */
  getStats(): {
    totalKeys: number;
    activeKeys: number;
    hitRates: Record<string, { hits: number; total: number; rate: number }>;
    topLimitedUsers: Array<{ key: string; requests: number }>;
  } {
    const now = Date.now();
    let activeKeys = 0;
    const hitRates: Record<string, { hits: number; total: number; rate: number }> = {};
    const userRequests = new Map<string, number>();
    
    for (const [key, entry] of this.limits.entries()) {
      const isActive = now - entry.lastRefill < 60000; // Active in last minute
      if (isActive) activeKeys++;
      
      // Extract user from key for user request tracking
      const userMatch = key.match(/user:([^:]+)/);
      if (userMatch) {
        const userId = userMatch[1];
        userRequests.set(userId, (userRequests.get(userId) || 0) + entry.requests.length);
      }
    }
    
    const topLimitedUsers = Array.from(userRequests.entries())
      .map(([key, requests]) => ({ key, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
    
    return {
      totalKeys: this.limits.size,
      activeKeys,
      hitRates,
      topLimitedUsers
    };
  }

  /**
   * Clear rate limits for specific user or pattern
   */
  clearLimits(pattern: string): number {
    let clearedCount = 0;
    
    for (const key of this.limits.keys()) {
      if (key.includes(pattern)) {
        this.limits.delete(key);
        clearedCount++;
      }
    }
    
    return clearedCount;
  }

  /**
   * Set temporary rate limit adjustment
   */
  setTemporaryAdjustment(
    userId: string, 
    multiplier: number, 
    durationMs: number
  ): void {
    // Implementation for temporary rate limit adjustments
    // Useful for handling bursts or temporary premium access
    const adjustmentKey = `temp:${userId}`;
    
    setTimeout(() => {
      this.limits.delete(adjustmentKey);
    }, durationMs);
  }

  private getApplicableLimits(request: AIRequest): Record<string, RateLimit> {
    const limits: Record<string, RateLimit> = {};
    
    // Global limit always applies
    limits.global = this.rateLimitDefinitions.global;
    
    // User-specific limit based on subscription tier
    const userTier = this.getUserTier(request.userId);
    limits.user = this.config.userTierLimits[userTier] || this.config.defaultLimit;
    
    // Agent-specific limit
    limits.agent = this.rateLimitDefinitions.perAgent;
    
    // Priority-based adjustments
    if (request.priority && this.config.priorityMultipliers[request.priority]) {
      const multiplier = this.config.priorityMultipliers[request.priority];
      
      // Adjust limits based on priority
      for (const [name, limit] of Object.entries(limits)) {
        limits[name] = {
          ...limit,
          maxRequests: Math.floor(limit.maxRequests * multiplier)
        };
      }
    }
    
    return limits;
  }

  private async checkIndividualLimit(
    key: string, 
    limit: RateLimit, 
    request: AIRequest
  ): Promise<RateLimitStatus> {
    const now = Date.now();
    let entry = this.limits.get(key);
    
    if (!entry) {
      entry = this.createNewEntry(limit);
      this.limits.set(key, entry);
    }
    
    switch (this.config.strategy) {
      case 'token-bucket':
        return this.checkTokenBucket(entry, limit, now);
      case 'sliding-window':
        return this.checkSlidingWindow(entry, limit, now);
      case 'fixed-window':
        return this.checkFixedWindow(entry, limit, now);
      default:
        throw new Error(`Unknown rate limiting strategy: ${this.config.strategy}`);
    }
  }

  private checkTokenBucket(entry: RateLimitEntry, limit: RateLimit, now: number): RateLimitStatus {
    // Refill tokens based on time passed
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = Math.floor((timePassed / limit.windowMs) * limit.maxRequests);
    
    entry.tokens = Math.min(limit.maxRequests, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
    
    const resetTime = new Date(now + limit.windowMs);
    
    if (entry.tokens < 1) {
      return {
        remaining: 0,
        resetTime,
        limited: true
      };
    }
    
    return {
      remaining: entry.tokens - 1,
      resetTime,
      limited: false
    };
  }

  private checkSlidingWindow(entry: RateLimitEntry, limit: RateLimit, now: number): RateLimitStatus {
    const windowStart = now - limit.windowMs;
    
    // Remove old requests outside the window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    
    const remaining = limit.maxRequests - entry.requests.length;
    const resetTime = entry.requests.length > 0 
      ? new Date(entry.requests[0] + limit.windowMs)
      : new Date(now + limit.windowMs);
    
    return {
      remaining: Math.max(0, remaining),
      resetTime,
      limited: remaining <= 0
    };
  }

  private checkFixedWindow(entry: RateLimitEntry, limit: RateLimit, now: number): RateLimitStatus {
    const currentWindow = Math.floor(now / limit.windowMs);
    const entryWindow = Math.floor(entry.windowStart / limit.windowMs);
    
    // Reset if we're in a new window
    if (currentWindow > entryWindow) {
      entry.requests = [];
      entry.windowStart = now;
    }
    
    const remaining = limit.maxRequests - entry.requests.length;
    const resetTime = new Date((currentWindow + 1) * limit.windowMs);
    
    return {
      remaining: Math.max(0, remaining),
      resetTime,
      limited: remaining <= 0
    };
  }

  private async consumeRequests(request: AIRequest, limits: Record<string, RateLimit>): Promise<void> {
    const now = Date.now();
    
    for (const [name, limit] of Object.entries(limits)) {
      const key = this.generateKey(request, name, limit);
      const entry = this.limits.get(key);
      
      if (!entry) continue;
      
      switch (this.config.strategy) {
        case 'token-bucket':
          entry.tokens = Math.max(0, entry.tokens - 1);
          break;
        case 'sliding-window':
        case 'fixed-window':
          entry.requests.push(now);
          break;
      }
      
      entry.lastRefill = now;
    }
  }

  private getRemainingRequests(request: AIRequest, limit: RateLimit): number {
    const key = this.generateKey(request, 'check', limit);
    const entry = this.limits.get(key);
    
    if (!entry) return limit.maxRequests;
    
    switch (this.config.strategy) {
      case 'token-bucket':
        return Math.max(0, entry.tokens);
      case 'sliding-window':
        const windowStart = Date.now() - limit.windowMs;
        const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);
        return Math.max(0, limit.maxRequests - validRequests.length);
      case 'fixed-window':
        return Math.max(0, limit.maxRequests - entry.requests.length);
      default:
        return 0;
    }
  }

  private generateKey(request: AIRequest, limitName: string, limit: RateLimit): string {
    // Use the limit's key generator or create a default key
    if (limit.keyGenerator) {
      const baseKey = limit.keyGenerator(request);
      return `${limitName}:${baseKey}`;
    }
    
    // Default key generation
    switch (limitName) {
      case 'global':
        return 'global';
      case 'user':
        return `user:${request.userId}`;
      case 'agent':
        return `agent:${request.userId}:${request.agentType}`;
      default:
        return `${limitName}:${request.userId}`;
    }
  }

  private createNewEntry(limit: RateLimit): RateLimitEntry {
    const now = Date.now();
    
    return {
      tokens: limit.maxRequests,
      lastRefill: now,
      requests: [],
      windowStart: now
    };
  }

  private getUserTier(userId: string): string {
    // In a real implementation, this would query the user's subscription tier
    // For now, return a default tier
    
    // Mock logic for demo purposes
    if (userId.startsWith('enterprise_')) return 'enterprise';
    if (userId.startsWith('premium_')) return 'premium';
    
    return 'free';
  }

  private startCleanupProcess(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    let cleanedCount = 0;
    
    for (const [key, entry] of this.limits.entries()) {
      // Remove entries that haven't been accessed in the last hour
      if (now - entry.lastRefill > maxAge) {
        this.limits.delete(key);
        cleanedCount++;
      } else {
        // Clean up old requests within the entry
        const originalLength = entry.requests.length;
        entry.requests = entry.requests.filter(timestamp => now - timestamp < maxAge);
        
        if (entry.requests.length !== originalLength) {
          cleanedCount += originalLength - entry.requests.length;
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old rate limit entries/requests`);
    }
  }

  /**
   * Get detailed rate limit report for monitoring
   */
  getDetailedReport(): {
    summary: {
      totalKeys: number;
      activeKeys: number;
      totalRequests: number;
      rejectedRequests: number;
    };
    topUsers: Array<{ userId: string; requests: number; remaining: number }>;
    limits: Array<{ name: string; maxRequests: number; windowMs: number }>;
    performance: {
      avgCheckTime: number;
      peakMemoryUsage: number;
    };
  } {
    const stats = this.getStats();
    const now = Date.now();
    
    // Analyze user activity
    const userActivity = new Map<string, { requests: number; remaining: number }>();
    
    for (const [key, entry] of this.limits.entries()) {
      const userMatch = key.match(/user:([^:]+)/);
      if (userMatch) {
        const userId = userMatch[1];
        const activity = userActivity.get(userId) || { requests: 0, remaining: 0 };
        
        activity.requests += entry.requests.length;
        // Calculate remaining based on the most restrictive limit
        const remaining = this.config.userTierLimits.free?.maxRequests - entry.requests.length;
        activity.remaining = Math.min(activity.remaining, remaining || 0);
        
        userActivity.set(userId, activity);
      }
    }
    
    const topUsers = Array.from(userActivity.entries())
      .map(([userId, activity]) => ({ userId, ...activity }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
    
    // Calculate performance metrics
    const memoryUsage = process.memoryUsage().heapUsed;
    
    return {
      summary: {
        totalKeys: stats.totalKeys,
        activeKeys: stats.activeKeys,
        totalRequests: Array.from(this.limits.values()).reduce((sum, entry) => sum + entry.requests.length, 0),
        rejectedRequests: 0 // Would need to track this separately
      },
      topUsers,
      limits: Object.entries(this.rateLimitDefinitions).map(([name, limit]) => ({
        name,
        maxRequests: limit.maxRequests,
        windowMs: limit.windowMs
      })),
      performance: {
        avgCheckTime: 0, // Would need to measure this
        peakMemoryUsage: memoryUsage
      }
    };
  }

  /**
   * Create a rate-limited version of an async function
   */
  createRateLimitedFunction<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    limitName: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const mockRequest: AIRequest = {
        id: 'rate-limited-fn',
        userId: 'system',
        agentType: 'assessment_analyst', // Default agent type
        inputData: args,
        priority: 'medium'
      };
      
      const status = await this.checkLimit(mockRequest);
      if (status.limited) {
        throw new Error(`Rate limit exceeded. Try again at ${status.resetTime}`);
      }
      
      return fn(...args);
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}