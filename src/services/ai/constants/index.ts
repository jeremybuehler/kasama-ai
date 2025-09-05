/**
 * AI Service Constants
 * Configuration constants for the 5-agent AI system
 */

import { AIProvider, AIModel, RetryConfig, RateLimit } from '../types';

// Model Configurations
export const AI_MODELS: AIModel[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    maxTokens: 200000,
    costPerToken: 0.000003, // $3 per million tokens
    strengths: ['reasoning', 'analysis', 'empathy', 'complex_instructions'],
    limitations: ['image_generation', 'realtime_data'],
    recommendedFor: ['assessment_analyst', 'insight_generator', 'communication_advisor']
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'claude',
    maxTokens: 200000,
    costPerToken: 0.00000025, // $0.25 per million tokens
    strengths: ['speed', 'efficiency', 'simple_tasks'],
    limitations: ['complex_reasoning', 'long_context'],
    recommendedFor: ['progress_tracker']
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4 Omni',
    provider: 'openai',
    maxTokens: 128000,
    costPerToken: 0.0000025, // $2.5 per million input tokens
    strengths: ['structured_output', 'function_calling', 'multimodal'],
    limitations: ['context_length', 'cost'],
    recommendedFor: ['learning_coach', 'progress_tracker']
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 16385,
    costPerToken: 0.0000005, // $0.5 per million tokens
    strengths: ['speed', 'cost', 'general_tasks'],
    limitations: ['complex_reasoning', 'context_length'],
    recommendedFor: ['progress_tracker']
  }
];

// Provider Configurations
export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'claude',
    priority: 1,
    maxTokens: 200000,
    costPerToken: 0.000003,
    rateLimitPerMinute: 60,
    latencyMs: 1500,
    reliability: 0.98,
    capabilities: [
      { name: 'reasoning', quality: 0.95, speed: 0.8, cost: 0.7, reliability: 0.98 },
      { name: 'empathy', quality: 0.92, speed: 0.8, cost: 0.7, reliability: 0.98 },
      { name: 'analysis', quality: 0.94, speed: 0.75, cost: 0.7, reliability: 0.98 }
    ],
    models: AI_MODELS.filter(m => m.provider === 'claude')
  },
  {
    name: 'openai',
    priority: 2,
    maxTokens: 128000,
    costPerToken: 0.0000025,
    rateLimitPerMinute: 100,
    latencyMs: 1000,
    reliability: 0.96,
    capabilities: [
      { name: 'structured_output', quality: 0.9, speed: 0.9, cost: 0.8, reliability: 0.96 },
      { name: 'function_calling', quality: 0.88, speed: 0.85, cost: 0.8, reliability: 0.96 },
      { name: 'general_tasks', quality: 0.85, speed: 0.9, cost: 0.9, reliability: 0.96 }
    ],
    models: AI_MODELS.filter(m => m.provider === 'openai')
  },
  {
    name: 'local',
    priority: 3,
    maxTokens: 8192,
    costPerToken: 0,
    rateLimitPerMinute: 30,
    latencyMs: 3000,
    reliability: 0.85,
    capabilities: [
      { name: 'privacy', quality: 1.0, speed: 0.5, cost: 1.0, reliability: 0.85 },
      { name: 'basic_tasks', quality: 0.7, speed: 0.5, cost: 1.0, reliability: 0.85 }
    ],
    models: []
  }
];

// Agent-specific configurations
export const AGENT_CONFIGS = {
  assessment_analyst: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    fallbackModel: 'gpt-4o',
    maxTokens: 4000,
    temperature: 0.3, // Lower for consistency
    priority: 'high' as const,
    cacheEnabled: true,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['rate_limit', 'timeout', 'server_error']
    }
  },
  learning_coach: {
    defaultModel: 'gpt-4o',
    fallbackModel: 'claude-3-5-sonnet-20241022',
    maxTokens: 6000,
    temperature: 0.5, // Moderate for creativity
    priority: 'high' as const,
    cacheEnabled: true,
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['rate_limit', 'timeout', 'server_error']
    }
  },
  progress_tracker: {
    defaultModel: 'claude-3-haiku-20240307',
    fallbackModel: 'gpt-3.5-turbo',
    maxTokens: 2000,
    temperature: 0.2, // Lower for consistency
    priority: 'medium' as const,
    cacheEnabled: true,
    cacheTTL: 6 * 60 * 60 * 1000, // 6 hours
    retryConfig: {
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      retryableErrors: ['rate_limit', 'timeout']
    }
  },
  insight_generator: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    fallbackModel: 'gpt-4o',
    maxTokens: 3000,
    temperature: 0.7, // Higher for creativity
    priority: 'medium' as const,
    cacheEnabled: true,
    cacheTTL: 4 * 60 * 60 * 1000, // 4 hours
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      backoffMultiplier: 2,
      retryableErrors: ['rate_limit', 'timeout', 'server_error']
    }
  },
  communication_advisor: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    fallbackModel: 'gpt-4o',
    maxTokens: 5000,
    temperature: 0.4, // Moderate for empathy and accuracy
    priority: 'high' as const,
    cacheEnabled: true,
    cacheTTL: 8 * 60 * 60 * 1000, // 8 hours
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['rate_limit', 'timeout', 'server_error']
    }
  }
} as const;

// Cache configurations
export const CACHE_CONFIG = {
  maxSize: 10000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  semanticSimilarityThreshold: 0.85,
  embeddingDimensions: 100,
  compressionEnabled: true,
  persistToDisk: false // Set to true for production
};

// Rate limiting configurations
export const RATE_LIMITS: Record<string, RateLimit> = {
  global: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: () => 'global'
  },
  perUser: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyGenerator: (request) => request.userId
  },
  perAgent: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (request) => `${request.userId}:${request.agentType}`
  },
  premium: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    keyGenerator: (request) => request.userId
  },
  enterprise: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    keyGenerator: (request) => request.userId
  }
};

// Error codes and messages
export const ERROR_CODES = {
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  MODEL_OVERLOADED: 'MODEL_OVERLOADED',
  TIMEOUT: 'TIMEOUT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CACHE_ERROR: 'CACHE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  PROVIDER_UNAVAILABLE: 'AI provider is currently unavailable. Please try again later.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait before making another request.',
  INVALID_INPUT: 'Invalid input provided. Please check your request format.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please check your API credentials.',
  INSUFFICIENT_CREDITS: 'Insufficient credits to complete this request.',
  MODEL_OVERLOADED: 'AI model is currently overloaded. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  VALIDATION_FAILED: 'Input validation failed. Please check your data.',
  CACHE_ERROR: 'Cache operation failed. Request will proceed without cache.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please contact support if this persists.'
};

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  responseTime: {
    excellent: 1000, // < 1s
    good: 2000, // < 2s
    acceptable: 5000, // < 5s
    poor: 10000 // >= 10s
  },
  successRate: {
    excellent: 0.99,
    good: 0.95,
    acceptable: 0.90,
    poor: 0.85
  },
  cacheHitRate: {
    excellent: 0.80,
    good: 0.60,
    acceptable: 0.40,
    poor: 0.20
  },
  costEfficiency: {
    excellent: 0.02, // < $0.02 per request
    good: 0.05, // < $0.05 per request
    acceptable: 0.10, // < $0.10 per request
    poor: 0.20 // >= $0.20 per request
  }
};

// Batch processing configurations
export const BATCH_CONFIG = {
  maxBatchSize: 10,
  batchTimeout: 150, // ms
  maxConcurrentBatches: 3,
  priorityLevels: {
    high: 1,
    medium: 2,
    low: 3
  }
};

// Monitoring and alerting
export const MONITORING_CONFIG = {
  metricsCollectionInterval: 60000, // 1 minute
  alertThresholds: {
    errorRate: 0.05, // 5%
    avgResponseTime: 5000, // 5 seconds
    queueSize: 50,
    cacheHitRate: 0.3, // Below 30%
    costPerHour: 1.0 // $1 per hour
  },
  retentionPeriods: {
    metrics: 30 * 24 * 60 * 60 * 1000, // 30 days
    logs: 7 * 24 * 60 * 60 * 1000, // 7 days
    errors: 90 * 24 * 60 * 60 * 1000 // 90 days
  }
};

// Development and testing
export const DEV_CONFIG = {
  enableMockResponses: process.env.NODE_ENV === 'development',
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableMetrics: true,
  enableCaching: true,
  enableRateLimiting: process.env.NODE_ENV === 'production',
  mockLatency: {
    min: 500,
    max: 2000
  }
};

// API endpoints and configurations
export const API_CONFIG = {
  claude: {
    baseUrl: 'https://api.anthropic.com',
    version: 'v1',
    timeout: 30000, // 30 seconds
    maxRetries: 3
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    version: 'v1',
    timeout: 30000, // 30 seconds
    maxRetries: 3
  }
};

// Feature flags
export const FEATURE_FLAGS = {
  enableSemanticCache: true,
  enableBatchProcessing: true,
  enableCostOptimization: true,
  enablePerformanceMonitoring: true,
  enableA11yValidation: true,
  enableAdvancedAnalytics: true,
  enableWebhooks: false, // Enable when webhook infrastructure is ready
  enableModelFallback: true,
  enableDynamicPricing: false // Future feature
};

// System limits
export const SYSTEM_LIMITS = {
  maxRequestsPerSecond: 10,
  maxConcurrentRequests: 20,
  maxQueueSize: 100,
  maxCacheSize: 1000000, // 1M entries
  maxTokensPerRequest: 200000,
  maxBatchSize: 50,
  maxRetryAttempts: 5,
  maxContextHistory: 10
};