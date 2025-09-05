/**
 * AI Service Utilities
 * 
 * Utility functions for AI service operations including validation,
 * formatting, performance monitoring, and helper functions.
 */

import { AIRequest, AIResponse, AgentType, UserProfile } from '../types';

/**
 * Validate AI request structure and data
 */
export function validateAIRequest(request: AIRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!request.id) {
    errors.push('Request ID is required');
  }
  
  if (!request.userId) {
    errors.push('User ID is required');
  }
  
  if (!request.agentType) {
    errors.push('Agent type is required');
  } else if (!['assessment_analyst', 'learning_coach', 'progress_tracker', 'insight_generator', 'communication_advisor'].includes(request.agentType)) {
    errors.push('Invalid agent type');
  }
  
  if (!request.inputData) {
    errors.push('Input data is required');
  }
  
  if (!request.priority || !['low', 'medium', 'high'].includes(request.priority)) {
    errors.push('Valid priority is required (low, medium, high)');
  }
  
  if (request.maxTokens && (request.maxTokens < 1 || request.maxTokens > 200000)) {
    errors.push('Max tokens must be between 1 and 200,000');
  }
  
  if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize input data to prevent injection attacks
 */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Format response for consistent output
 */
export function formatAIResponse(response: AIResponse): AIResponse {
  return {
    id: response.id,
    output: response.output,
    tokensUsed: Math.max(0, response.tokensUsed),
    processingTime: Math.max(0, response.processingTime),
    costCents: Math.max(0, response.costCents),
    cacheHit: Boolean(response.cacheHit),
    confidence: response.confidence ? Math.max(0, Math.min(1, response.confidence)) : undefined,
    provider: response.provider,
    model: response.model,
    error: response.error
  };
}

/**
 * Calculate request priority score for queuing
 */
export function calculatePriorityScore(request: AIRequest): number {
  let score = 0;
  
  // Base priority scores
  switch (request.priority) {
    case 'high': score += 100; break;
    case 'medium': score += 50; break;
    case 'low': score += 10; break;
  }
  
  // Agent type modifiers
  switch (request.agentType) {
    case 'assessment_analyst': score += 20; break; // High importance
    case 'communication_advisor': score += 20; break; // High importance
    case 'insight_generator': score += 10; break;
    case 'learning_coach': score += 10; break;
    case 'progress_tracker': score += 5; break;
  }
  
  // Time-based urgency (older requests get higher priority)
  const requestAge = Date.now() - new Date(request.id).getTime();
  score += Math.min(50, requestAge / (1000 * 60)); // Up to 50 points for age in minutes
  
  return score;
}

/**
 * Estimate token count from text
 */
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // More accurate models would use actual tokenizer
  return Math.ceil(text.length / 4);
}

/**
 * Compress text while preserving meaning
 */
export function compressText(text: string, maxLength: number = 1000): string {
  if (text.length <= maxLength) return text;
  
  // Simple compression strategies
  let compressed = text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n') // Multiple newlines to single newline
    .trim();
  
  if (compressed.length > maxLength) {
    // Truncate with ellipsis
    compressed = compressed.substring(0, maxLength - 3) + '...';
  }
  
  return compressed;
}

/**
 * Extract key information from user profile
 */
export function extractUserContext(profile: UserProfile): {
  tier: string;
  preferences: string[];
  riskFactors: string[];
  personalizationFactors: string[];
} {
  const preferences: string[] = [];
  const riskFactors: string[] = [];
  const personalizationFactors: string[] = [];
  
  if (profile.preferences) {
    if (profile.preferences.communicationStyle) {
      preferences.push(`communication: ${profile.preferences.communicationStyle}`);
      personalizationFactors.push(profile.preferences.communicationStyle);
    }
    
    if (profile.preferences.learningPace) {
      preferences.push(`pace: ${profile.preferences.learningPace}`);
      personalizationFactors.push(profile.preferences.learningPace);
    }
    
    if (profile.preferences.preferredTopics) {
      preferences.push(`topics: ${profile.preferences.preferredTopics.join(', ')}`);
      personalizationFactors.push(...profile.preferences.preferredTopics);
    }
    
    if (profile.preferences.aiPersonality) {
      preferences.push(`personality: ${profile.preferences.aiPersonality}`);
    }
  }
  
  // Identify risk factors
  if (profile.subscriptionTier === 'free') {
    riskFactors.push('cost_sensitivity');
  }
  
  if (profile.preferences?.privacyLevel === 'private') {
    riskFactors.push('privacy_sensitive');
  }
  
  return {
    tier: profile.subscriptionTier,
    preferences,
    riskFactors,
    personalizationFactors
  };
}

/**
 * Generate hash for content deduplication
 */
export function generateContentHash(content: unknown): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Parse and validate JSON safely
 */
export function safeJSONParse<T = unknown>(str: string, fallback?: T): T | null {
  try {
    const parsed = JSON.parse(str);
    return parsed as T;
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback || null;
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      // Add jitter (±25% randomization)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      const finalDelay = Math.max(0, delay + jitter);
      
      console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(finalDelay)}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Measure function execution time
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; executionTime: number }> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const executionTime = performance.now() - startTime;
    
    if (label) {
      console.log(`${label} executed in ${executionTime.toFixed(2)}ms`);
    }
    
    return { result, executionTime };
  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    if (label) {
      console.error(`${label} failed after ${executionTime.toFixed(2)}ms:`, error);
    }
    
    throw error;
  }
}

/**
 * Rate limiting utility with sliding window
 */
export class RateLimitCounter {
  private requests: number[] = [];
  private windowMs: number;
  private maxRequests: number;
  
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return this.requests.length < this.maxRequests;
  }
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
  
  getRequestCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length;
  }
  
  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const resetTime = oldestRequest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    
    const values = this.metrics.get(metric)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  getStats(metric: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    percentile95: number;
  } | null {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const average = values.reduce((sum, val) => sum + val, 0) / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const percentile95 = sorted[Math.floor(count * 0.95)];
    
    return { count, average, min, max, percentile95 };
  }
  
  getAllMetrics(): Record<string, ReturnType<PerformanceMonitor['getStats']>> {
    const result: Record<string, ReturnType<PerformanceMonitor['getStats']>> = {};
    
    for (const metric of this.metrics.keys()) {
      result[metric] = this.getStats(metric);
    }
    
    return result;
  }
  
  reset(metric?: string): void {
    if (metric) {
      this.metrics.delete(metric);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Create a throttled version of a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
}

/**
 * Validate and normalize agent type
 */
export function normalizeAgentType(agentType: string): AgentType | null {
  const validAgentTypes: AgentType[] = [
    'assessment_analyst',
    'learning_coach',
    'progress_tracker',
    'insight_generator',
    'communication_advisor'
  ];
  
  const normalized = agentType.toLowerCase().replace(/[-\s]/g, '_') as AgentType;
  
  return validAgentTypes.includes(normalized) ? normalized : null;
}

/**
 * Create a circuit breaker for function calls
 */
export class CircuitBreaker<T extends (...args: any[]) => Promise<any>> {
  private failures = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private fn: T,
    private options: {
      failureThreshold: number;
      resetTimeoutMs: number;
      monitoringPeriodMs: number;
    }
  ) {}
  
  async execute(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await this.fn(...args);
      
      // Success - reset failure count and close circuit
      this.failures = 0;
      this.state = 'CLOSED';
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.options.failureThreshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }
  
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
  
  getFailureCount(): number {
    return this.failures;
  }
  
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}