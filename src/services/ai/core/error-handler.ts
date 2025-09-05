/**
 * AI Error Handler
 * 
 * Comprehensive error handling and recovery system for AI operations.
 * Includes retry logic, fallback strategies, and error classification.
 */

import { ERROR_CODES, ERROR_MESSAGES } from '../constants';
import { AIError, RetryConfig, AgentType } from '../types';

export interface ErrorContext {
  agentType?: AgentType;
  provider?: string;
  model?: string;
  userId?: string;
  requestId?: string;
  attempt?: number;
  totalAttempts?: number;
}

export interface ErrorMetrics {
  errorCode: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedUsers: Set<string>;
  affectedAgents: Set<AgentType>;
}

export class ErrorHandler {
  private errorMetrics = new Map<string, ErrorMetrics>();
  private retryConfigs = new Map<string, RetryConfig>();
  private errorCallbacks = new Map<string, (error: AIError, context?: ErrorContext) => void>();

  constructor() {
    this.initializeDefaultRetryConfigs();
    this.startMetricsCleanup();
  }

  /**
   * Handle and classify errors, determine retry strategy
   */
  handleError(error: unknown, context: ErrorContext = {}): AIError {
    const aiError = this.classifyError(error, context);
    
    // Record error metrics
    this.recordError(aiError, context);
    
    // Execute error callbacks
    const callback = this.errorCallbacks.get(aiError.code);
    if (callback) {
      callback(aiError, context);
    }
    
    // Log error for monitoring
    this.logError(aiError, context);
    
    return aiError;
  }

  /**
   * Execute operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig,
    context: ErrorContext = {}
  ): Promise<T> {
    let lastError: AIError;
    let attempt = 1;
    
    while (attempt <= retryConfig.maxAttempts) {
      try {
        const result = await operation();
        
        // Log successful retry if it wasn't the first attempt
        if (attempt > 1) {
          console.log(`Operation succeeded on attempt ${attempt}/${retryConfig.maxAttempts}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = this.classifyError(error, { ...context, attempt, totalAttempts: retryConfig.maxAttempts });
        
        // Don't retry if error is not retryable or max attempts reached
        if (!lastError.retryable || attempt >= retryConfig.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        
        console.warn(`Operation failed on attempt ${attempt}/${retryConfig.maxAttempts}. Retrying in ${delay}ms:`, lastError.message);
        
        await this.sleep(delay);
        attempt++;
      }
    }
    
    // All retries exhausted
    this.recordError(lastError!, context);
    throw lastError!;
  }

  /**
   * Check if an error should trigger a circuit breaker
   */
  shouldTriggerCircuitBreaker(errorCode: string, timeWindow: number = 5 * 60 * 1000): boolean {
    const metrics = this.errorMetrics.get(errorCode);
    if (!metrics) return false;
    
    const recentErrorThreshold = 10; // 10 errors in time window
    const cutoffTime = Date.now() - timeWindow;
    
    return metrics.count >= recentErrorThreshold && metrics.lastOccurrence.getTime() > cutoffTime;
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByAgent: Record<string, number>;
    topErrors: Array<{ code: string; count: number; message: string }>;
    errorRate: number;
  } {
    const cutoffTime = Date.now() - timeWindow;
    const recentErrors = Array.from(this.errorMetrics.values())
      .filter(metrics => metrics.lastOccurrence.getTime() > cutoffTime);
    
    const errorsByCode: Record<string, number> = {};
    const errorsByAgent: Record<string, number> = {};
    let totalErrors = 0;
    
    recentErrors.forEach(metrics => {
      errorsByCode[metrics.errorCode] = metrics.count;
      totalErrors += metrics.count;
      
      metrics.affectedAgents.forEach(agent => {
        errorsByAgent[agent] = (errorsByAgent[agent] || 0) + metrics.count;
      });
    });
    
    const topErrors = Object.entries(errorsByCode)
      .map(([code, count]) => ({
        code,
        count,
        message: ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || 'Unknown error'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalErrors,
      errorsByCode,
      errorsByAgent,
      topErrors,
      errorRate: totalErrors / timeWindow * 1000 // errors per second
    };
  }

  /**
   * Register custom error callback
   */
  onError(errorCode: string, callback: (error: AIError, context?: ErrorContext) => void): void {
    this.errorCallbacks.set(errorCode, callback);
  }

  /**
   * Register custom retry configuration
   */
  setRetryConfig(key: string, config: RetryConfig): void {
    this.retryConfigs.set(key, config);
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(key: string): RetryConfig | undefined {
    return this.retryConfigs.get(key);
  }

  private classifyError(error: unknown, context: ErrorContext): AIError {
    let code: keyof typeof ERROR_CODES = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred';
    let retryable = false;
    
    if (error instanceof Error) {
      message = error.message;
      
      // Classify based on error message patterns
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        code = 'RATE_LIMIT_EXCEEDED';
        retryable = true;
      } else if (errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        code = 'TIMEOUT';
        retryable = true;
      } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('authentication')) {
        code = 'AUTHENTICATION_FAILED';
        retryable = false;
      } else if (errorMsg.includes('400') || errorMsg.includes('invalid') || errorMsg.includes('validation')) {
        code = 'INVALID_INPUT';
        retryable = false;
      } else if (errorMsg.includes('503') || errorMsg.includes('overload') || errorMsg.includes('unavailable')) {
        code = 'MODEL_OVERLOADED';
        retryable = true;
      } else if (errorMsg.includes('402') || errorMsg.includes('quota') || errorMsg.includes('credits')) {
        code = 'INSUFFICIENT_CREDITS';
        retryable = false;
      } else if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('504')) {
        code = 'PROVIDER_UNAVAILABLE';
        retryable = true;
      }
    } else if (typeof error === 'string') {
      message = error;
    }
    
    return {
      code,
      message: ERROR_MESSAGES[code] || message,
      provider: context.provider,
      model: context.model,
      agentType: context.agentType,
      retryable,
      context: {
        originalMessage: message,
        ...context
      },
      timestamp: new Date()
    };
  }

  private recordError(error: AIError, context: ErrorContext): void {
    let metrics = this.errorMetrics.get(error.code);
    
    if (!metrics) {
      metrics = {
        errorCode: error.code,
        count: 0,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        affectedUsers: new Set(),
        affectedAgents: new Set()
      };
      this.errorMetrics.set(error.code, metrics);
    }
    
    metrics.count++;
    metrics.lastOccurrence = new Date();
    
    if (context.userId) {
      metrics.affectedUsers.add(context.userId);
    }
    
    if (error.agentType) {
      metrics.affectedAgents.add(error.agentType);
    }
  }

  private logError(error: AIError, context: ErrorContext): void {
    const logData = {
      code: error.code,
      message: error.message,
      provider: error.provider,
      model: error.model,
      agentType: error.agentType,
      retryable: error.retryable,
      context,
      timestamp: error.timestamp
    };
    
    if (error.retryable) {
      console.warn('Retryable AI error:', logData);
    } else {
      console.error('Non-retryable AI error:', logData);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(logData);
    }
  }

  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff with jitter
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Add jitter (±25% randomization)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
    
    return Math.max(0, cappedDelay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeDefaultRetryConfigs(): void {
    // Default retry configurations for different scenarios
    this.retryConfigs.set('default', {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['RATE_LIMIT_EXCEEDED', 'TIMEOUT', 'MODEL_OVERLOADED', 'PROVIDER_UNAVAILABLE']
    });
    
    this.retryConfigs.set('aggressive', {
      maxAttempts: 5,
      baseDelay: 500,
      maxDelay: 8000,
      backoffMultiplier: 2,
      retryableErrors: ['RATE_LIMIT_EXCEEDED', 'TIMEOUT', 'MODEL_OVERLOADED', 'PROVIDER_UNAVAILABLE']
    });
    
    this.retryConfigs.set('conservative', {
      maxAttempts: 2,
      baseDelay: 2000,
      maxDelay: 15000,
      backoffMultiplier: 3,
      retryableErrors: ['RATE_LIMIT_EXCEEDED', 'TIMEOUT', 'MODEL_OVERLOADED']
    });
    
    this.retryConfigs.set('rate_limit', {
      maxAttempts: 3,
      baseDelay: 5000, // Longer delay for rate limits
      maxDelay: 60000, // Up to 1 minute
      backoffMultiplier: 2,
      retryableErrors: ['RATE_LIMIT_EXCEEDED']
    });
  }

  private startMetricsCleanup(): void {
    // Clean up old error metrics every hour
    setInterval(() => {
      this.cleanupMetrics();
    }, 60 * 60 * 1000);
  }

  private cleanupMetrics(): void {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    let cleanedCount = 0;
    
    for (const [key, metrics] of this.errorMetrics.entries()) {
      if (metrics.lastOccurrence.getTime() < cutoffTime) {
        this.errorMetrics.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old error metrics`);
    }
  }

  private sendToMonitoring(logData: unknown): void {
    // Placeholder for monitoring service integration
    // In production, integrate with services like Sentry, DataDog, etc.
    try {
      // Example: Sentry.captureException(logData);
      // Example: DataDog.increment('ai.errors', 1, { error_code: logData.code });
      console.log('Sending to monitoring service:', logData);
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  /**
   * Create a circuit breaker for error-prone operations
   */
  createCircuitBreaker<T>(
    operation: () => Promise<T>,
    options: {
      failureThreshold: number;
      resetTimeout: number;
      monitorWindow: number;
    }
  ): () => Promise<T> {
    let state: 'closed' | 'open' | 'half-open' = 'closed';
    let failures = 0;
    let lastFailure: Date;
    let nextAttempt: Date;
    
    return async (): Promise<T> => {
      const now = new Date();
      
      // Reset failure count if outside monitor window
      if (lastFailure && (now.getTime() - lastFailure.getTime()) > options.monitorWindow) {
        failures = 0;
        state = 'closed';
      }
      
      // Check circuit breaker state
      if (state === 'open') {
        if (now < nextAttempt) {
          throw this.classifyError('Circuit breaker is open', {});
        }
        state = 'half-open';
      }
      
      try {
        const result = await operation();
        
        // Success resets the circuit breaker
        if (state === 'half-open') {
          state = 'closed';
          failures = 0;
        }
        
        return result;
        
      } catch (error) {
        failures++;
        lastFailure = now;
        
        if (failures >= options.failureThreshold) {
          state = 'open';
          nextAttempt = new Date(now.getTime() + options.resetTimeout);
          console.warn(`Circuit breaker opened after ${failures} failures`);
        }
        
        throw error;
      }
    };
  }

  /**
   * Clear all error metrics (useful for testing)
   */
  clearMetrics(): void {
    this.errorMetrics.clear();
  }

  /**
   * Get detailed error report
   */
  getDetailedErrorReport(): {
    summary: ReturnType<ErrorHandler['getErrorStats']>;
    metrics: Array<ErrorMetrics & { errorCode: string }>;
    recommendations: string[];
  } {
    const summary = this.getErrorStats();
    const metrics = Array.from(this.errorMetrics.entries()).map(([code, metric]) => ({
      errorCode: code,
      ...metric,
      affectedUsers: Array.from(metric.affectedUsers),
      affectedAgents: Array.from(metric.affectedAgents)
    }));
    
    const recommendations: string[] = [];
    
    // Generate recommendations based on error patterns
    if (summary.errorsByCode['RATE_LIMIT_EXCEEDED'] > 10) {
      recommendations.push('Consider implementing more aggressive caching or request queuing');
    }
    
    if (summary.errorsByCode['TIMEOUT'] > 5) {
      recommendations.push('Review timeout configurations and consider increasing limits');
    }
    
    if (summary.errorsByCode['PROVIDER_UNAVAILABLE'] > 3) {
      recommendations.push('Implement more robust provider fallback strategies');
    }
    
    if (summary.errorRate > 0.1) { // More than 0.1 errors per second
      recommendations.push('Error rate is high - investigate system health and capacity');
    }
    
    return {
      summary,
      metrics: metrics as Array<ErrorMetrics & { errorCode: string }>,
      recommendations
    };
  }
}