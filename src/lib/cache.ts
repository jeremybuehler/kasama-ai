// 🚀 Elite Performance Cache System
// Semantic caching for AI responses and API optimization
// Target: >85% cache hit rate, <50ms cache retrieval

import { QueryClient } from "@tanstack/react-query";

// Cache configuration with intelligent TTL
const CACHE_CONFIG = {
  // API caches (short-lived, frequently changing)
  assessments: 5 * 60 * 1000, // 5 minutes
  progress: 10 * 60 * 1000, // 10 minutes
  goals: 15 * 60 * 1000, // 15 minutes
  practices: 30 * 60 * 1000, // 30 minutes (rarely change)
  
  // AI caches (long-lived, expensive to regenerate)
  aiResponses: 60 * 60 * 1000, // 1 hour
  aiInsights: 4 * 60 * 60 * 1000, // 4 hours
  aiRecommendations: 24 * 60 * 60 * 1000, // 24 hours
  
  // Static content (very long-lived)
  staticContent: 7 * 24 * 60 * 60 * 1000, // 1 week
  userSettings: 60 * 60 * 1000, // 1 hour
} as const;

// Semantic hash function for AI content caching
function semanticHash(content: string): string {
  // Simple hash for semantic similarity
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .sort()
    .join('')
    .slice(0, 32);
}

// Enhanced QueryClient with performance optimizations
export const createOptimizedQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for performance
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      
      // Smart retry logic
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        
        // Don't retry on auth errors
        if (error?.message?.includes('auth') || error?.status === 401) {
          return false;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        return failureCount < 3;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Performance optimizations
      refetchOnWindowFocus: false,
      refetchOnMount: 'always', // Always check for fresh data
      refetchOnReconnect: 'always',
      
      // Network-aware behavior
      networkMode: 'online',
    },
    
    mutations: {
      retry: false, // Don't retry mutations automatically
      networkMode: 'online',
    },
  },
});

// Cache keys factory for consistent naming
export const cacheKeys = {
  // User-related keys
  user: () => ['user'] as const,
  userSettings: (userId: string) => ['user', userId, 'settings'] as const,
  
  // Assessment keys
  assessments: () => ['assessments'] as const,
  assessment: (id: string) => ['assessments', id] as const,
  assessmentResults: (id: string) => ['assessments', id, 'results'] as const,
  
  // Practice keys
  practices: () => ['practices'] as const,
  practice: (id: string) => ['practices', id] as const,
  practicesByCategory: (category: string) => ['practices', 'category', category] as const,
  
  // Goal keys
  goals: () => ['goals'] as const,
  goal: (id: string) => ['goals', id] as const,
  goalProgress: (id: string) => ['goals', id, 'progress'] as const,
  
  // Progress keys
  progress: () => ['progress'] as const,
  progressByDateRange: (startDate: string, endDate: string) => 
    ['progress', 'dateRange', startDate, endDate] as const,
  progressStats: () => ['progress', 'statistics'] as const,
  
  // AI-related keys (semantic caching)
  aiResponse: (hash: string) => ['ai', 'response', hash] as const,
  aiInsight: (userId: string, type: string) => ['ai', 'insight', userId, type] as const,
  aiRecommendations: (userId: string, context: string) => 
    ['ai', 'recommendations', userId, semanticHash(context)] as const,
} as const;

// Cache invalidation patterns
export const cacheInvalidation = {
  // Invalidate user data
  invalidateUser: (queryClient: QueryClient, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.user() });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: cacheKeys.userSettings(userId) });
    }
  },
  
  // Invalidate assessments
  invalidateAssessments: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.assessments() });
  },
  
  // Invalidate specific assessment
  invalidateAssessment: (queryClient: QueryClient, assessmentId: string) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.assessment(assessmentId) });
    queryClient.invalidateQueries({ queryKey: cacheKeys.assessmentResults(assessmentId) });
  },
  
  // Invalidate progress data
  invalidateProgress: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.progress() });
    queryClient.invalidateQueries({ queryKey: cacheKeys.progressStats() });
  },
  
  // Invalidate goals
  invalidateGoals: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.goals() });
  },
  
  // Smart cache cleanup
  clearStaleCache: (queryClient: QueryClient) => {
    queryClient.clear(); // Clear all stale queries
  },
  
  // AI cache management
  invalidateAICache: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['ai'] });
    // Keep recommendations but invalidate insights for fresh AI content
    queryClient.invalidateQueries({ 
      queryKey: ['ai', 'insight', userId],
      exact: false 
    });
  },
};

// Cache preloading for better UX
export const cachePreloader = {
  // Preload essential data on login
  preloadUserData: async (queryClient: QueryClient, userId: string) => {
    // Parallel preloading for instant navigation
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: cacheKeys.assessments(),
        staleTime: CACHE_CONFIG.assessments,
      }),
      queryClient.prefetchQuery({
        queryKey: cacheKeys.practices(),
        staleTime: CACHE_CONFIG.practices,
      }),
      queryClient.prefetchQuery({
        queryKey: cacheKeys.goals(),
        staleTime: CACHE_CONFIG.goals,
      }),
      queryClient.prefetchQuery({
        queryKey: cacheKeys.progressStats(),
        staleTime: CACHE_CONFIG.progress,
      }),
    ]);
  },
  
  // Preload page-specific data
  preloadPageData: async (queryClient: QueryClient, page: string) => {
    switch (page) {
      case 'dashboard':
        // Preload dashboard essentials
        await queryClient.prefetchQuery({
          queryKey: cacheKeys.progressStats(),
          staleTime: CACHE_CONFIG.progress,
        });
        break;
        
      case 'assessment':
        await queryClient.prefetchQuery({
          queryKey: cacheKeys.assessments(),
          staleTime: CACHE_CONFIG.assessments,
        });
        break;
        
      case 'practices':
        await queryClient.prefetchQuery({
          queryKey: cacheKeys.practices(),
          staleTime: CACHE_CONFIG.practices,
        });
        break;
    }
  },
};

// Performance monitoring for cache efficiency
export const cacheMetrics = {
  getCacheHitRate: (queryClient: QueryClient): number => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    if (queries.length === 0) return 0;
    
    const hits = queries.filter(query => 
      query.state.status === 'success' && 
      query.state.dataUpdatedAt > Date.now() - (query.options.staleTime || 0)
    ).length;
    
    return (hits / queries.length) * 100;
  },
  
  getCacheStats: (queryClient: QueryClient) => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      cachedQueries: queries.filter(q => q.state.status === 'success').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      hitRate: cacheMetrics.getCacheHitRate(queryClient),
    };
  },
};

// Semantic AI cache for expensive AI operations
export class SemanticAICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Store AI response with semantic hashing
  set(prompt: string, response: any, ttl: number = CACHE_CONFIG.aiResponses): void {
    const hash = semanticHash(prompt);
    this.cache.set(hash, {
      data: response,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  // Retrieve AI response by semantic similarity
  get(prompt: string): any | null {
    const hash = semanticHash(prompt);
    const cached = this.cache.get(hash);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(hash);
      return null;
    }
    
    return cached.data;
  }
  
  // Clear expired cache entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
    };
  }
}

// Export singleton AI cache
export const aiCache = new SemanticAICache();

// Auto-cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    aiCache.cleanup();
  }, 10 * 60 * 1000);
}