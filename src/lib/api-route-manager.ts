/**
 * AI-Powered API Route Manager
 * 
 * Intelligent routing system that dynamically selects optimal API endpoints
 * based on user context, performance metrics, and AI recommendations
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AIOrchestrator } from '../services/ai/orchestrator';
import { UserProfile } from '../services/ai/types';

interface RouteConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  timeout?: number;
  retryCount?: number;
  cacheStrategy?: 'none' | 'memory' | 'session' | 'persistent';
  aiOptimization?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

interface RequestContext {
  userId?: string;
  userProfile?: UserProfile;
  deviceInfo?: {
    isMobile: boolean;
    connectionSpeed: 'slow' | 'fast' | 'unknown';
    batteryLevel?: number;
  };
  performanceHints?: {
    preferFastResponse: boolean;
    acceptCachedData: boolean;
    lowBandwidth: boolean;
  };
}

interface RoutePerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  lastUsed: Date;
  errorRate: number;
  cacheHitRate: number;
}

class APIRouteManager {
  private client: AxiosInstance;
  private orchestrator: AIOrchestrator;
  private routes = new Map<string, RouteConfig>();
  private performanceMetrics = new Map<string, RoutePerformanceMetrics>();
  private rateLimits = new Map<string, { count: number; resetTime: number }>();
  private cache = new Map<string, { data: any; expiry: number }>();

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || process.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.orchestrator = new AIOrchestrator({
      enableCaching: true,
      enableRateLimiting: true,
      maxConcurrentRequests: 10
    });

    this.setupInterceptors();
    this.initializeDefaultRoutes();
  }

  /**
   * Make AI-optimized API request
   */
  async request<T = any>(
    routeId: string,
    data?: any,
    context?: RequestContext,
    options?: AxiosRequestConfig
  ): Promise<T> {
    
    const route = this.routes.get(routeId);
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    // Check rate limiting
    if (this.isRateLimited(routeId)) {
      throw new Error(`Rate limit exceeded for route ${routeId}`);
    }

    // Check cache first
    if (route.cacheStrategy !== 'none') {
      const cached = this.getCachedResponse<T>(routeId, data);
      if (cached && context?.performanceHints?.acceptCachedData) {
        return cached;
      }
    }

    // Get AI-optimized route configuration
    const optimizedConfig = route.aiOptimization 
      ? await this.getOptimizedConfig(route, context)
      : route;

    // Execute request with performance tracking
    const startTime = Date.now();
    
    try {
      const response = await this.executeRequest(optimizedConfig, data, options);
      
      // Record successful metrics
      this.recordMetrics(routeId, Date.now() - startTime, true);
      
      // Cache if applicable
      if (optimizedConfig.cacheStrategy !== 'none') {
        this.cacheResponse(routeId, data, response.data);
      }

      return response.data;
      
    } catch (error) {
      // Record failure metrics
      this.recordMetrics(routeId, Date.now() - startTime, false);
      
      // Try fallback or retry logic
      if (optimizedConfig.retryCount && optimizedConfig.retryCount > 0) {
        return this.retryRequest(routeId, data, context, options, optimizedConfig.retryCount);
      }
      
      throw error;
    }
  }

  /**
   * Register a new API route
   */
  registerRoute(routeId: string, config: RouteConfig): void {
    this.routes.set(routeId, {
      timeout: 15000,
      retryCount: 1,
      cacheStrategy: 'none',
      aiOptimization: false,
      priority: 'medium',
      ...config
    });

    // Initialize performance metrics
    this.performanceMetrics.set(routeId, {
      averageResponseTime: 0,
      successRate: 1,
      lastUsed: new Date(),
      errorRate: 0,
      cacheHitRate: 0
    });
  }

  /**
   * Batch multiple API requests with intelligent optimization
   */
  async batchRequest<T = any>(
    requests: Array<{
      routeId: string;
      data?: any;
      context?: RequestContext;
    }>,
    options?: {
      parallel?: boolean;
      maxConcurrency?: number;
      failFast?: boolean;
    }
  ): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
    
    const opts = {
      parallel: true,
      maxConcurrency: 5,
      failFast: false,
      ...options
    };

    // Group requests by priority for optimal execution
    const groupedRequests = this.groupRequestsByPriority(requests);
    const results: Array<{ success: boolean; data?: T; error?: Error }> = [];

    for (const [priority, requestGroup] of groupedRequests) {
      if (opts.parallel) {
        const batchResults = await this.executeBatchParallel<T>(requestGroup, opts.maxConcurrency);
        results.push(...batchResults);
        
        if (opts.failFast && batchResults.some(r => !r.success)) {
          break;
        }
      } else {
        for (const req of requestGroup) {
          try {
            const data = await this.request<T>(req.routeId, req.data, req.context);
            results.push({ success: true, data });
          } catch (error) {
            results.push({ success: false, error: error as Error });
            if (opts.failFast) break;
          }
        }
      }
    }

    return results;
  }

  /**
   * Get route performance analytics
   */
  getRouteAnalytics(): Record<string, RoutePerformanceMetrics & { routeConfig: RouteConfig }> {
    const analytics: Record<string, any> = {};
    
    for (const [routeId, metrics] of this.performanceMetrics) {
      const config = this.routes.get(routeId);
      analytics[routeId] = {
        ...metrics,
        routeConfig: config
      };
    }
    
    return analytics;
  }

  /**
   * Get AI recommendations for route optimization
   */
  async getRouteOptimizationRecommendations(): Promise<{
    recommendations: Array<{
      routeId: string;
      currentPerformance: RoutePerformanceMetrics;
      suggestedChanges: Partial<RouteConfig>;
      expectedImprovement: number;
    }>;
    overallScore: number;
  }> {
    
    const analytics = this.getRouteAnalytics();
    const recommendations: any[] = [];
    
    for (const [routeId, data] of Object.entries(analytics)) {
      const metrics = data as RoutePerformanceMetrics & { routeConfig: RouteConfig };
      
      // Use AI to analyze performance and suggest improvements
      try {
        const aiAnalysis = await this.orchestrator.analyzeAssessment({
          answers: {
            routeId,
            averageResponseTime: metrics.averageResponseTime,
            successRate: metrics.successRate,
            errorRate: metrics.errorRate,
            cacheHitRate: metrics.cacheHitRate
          },
          assessmentType: 'api_performance',
          userContext: undefined
        });

        const suggestedChanges = this.parsePerformanceRecommendations(aiAnalysis);
        const expectedImprovement = this.calculateExpectedImprovement(metrics, suggestedChanges);
        
        recommendations.push({
          routeId,
          currentPerformance: metrics,
          suggestedChanges,
          expectedImprovement
        });
        
      } catch (error) {
        console.warn(`Failed to get AI recommendations for route ${routeId}:`, error);
      }
    }

    const overallScore = this.calculateOverallPerformanceScore(analytics);
    
    return {
      recommendations,
      overallScore
    };
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timing
        config.metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = Date.now() - response.config.metadata?.startTime;
        response.config.metadata = { ...response.config.metadata, duration };
        
        return response;
      },
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize default API routes
   */
  private initializeDefaultRoutes(): void {
    // Authentication routes
    this.registerRoute('auth.login', {
      endpoint: '/auth/login',
      method: 'POST',
      priority: 'critical',
      timeout: 10000,
      retryCount: 2
    });

    this.registerRoute('auth.register', {
      endpoint: '/auth/register', 
      method: 'POST',
      priority: 'high',
      timeout: 10000
    });

    this.registerRoute('auth.refresh', {
      endpoint: '/auth/refresh',
      method: 'POST',
      priority: 'high',
      cacheStrategy: 'session'
    });

    // User profile routes
    this.registerRoute('user.profile', {
      endpoint: '/user/profile',
      method: 'GET',
      cacheStrategy: 'session',
      aiOptimization: true
    });

    this.registerRoute('user.updateProfile', {
      endpoint: '/user/profile',
      method: 'PUT',
      priority: 'high'
    });

    // AI service routes
    this.registerRoute('ai.assessment', {
      endpoint: '/ai/assessment',
      method: 'POST',
      priority: 'high',
      timeout: 20000,
      aiOptimization: true
    });

    this.registerRoute('ai.insights', {
      endpoint: '/ai/insights',
      method: 'POST',
      cacheStrategy: 'memory',
      aiOptimization: true
    });

    this.registerRoute('ai.learningPath', {
      endpoint: '/ai/learning-path',
      method: 'POST',
      priority: 'medium',
      timeout: 15000,
      aiOptimization: true
    });

    // Content routes
    this.registerRoute('content.practices', {
      endpoint: '/content/practices',
      method: 'GET',
      cacheStrategy: 'persistent',
      aiOptimization: true
    });

    this.registerRoute('progress.tracking', {
      endpoint: '/progress/tracking',
      method: 'GET',
      cacheStrategy: 'session',
      aiOptimization: true
    });
  }

  /**
   * Get AI-optimized configuration for a route
   */
  private async getOptimizedConfig(
    route: RouteConfig,
    context?: RequestContext
  ): Promise<RouteConfig> {
    
    if (!context) return route;

    try {
      // Use AI to optimize route configuration based on context
      const optimization = await this.orchestrator.provideCommunicationGuidance({
        scenario: `Optimize API route ${route.endpoint} for user context`,
        context: {
          userProfile: context.userProfile,
          deviceInfo: context.deviceInfo,
          performanceHints: context.performanceHints
        }
      }, context.userId);

      return this.applyOptimizations(route, optimization, context);
      
    } catch (error) {
      console.warn('AI optimization failed, using default config:', error);
      return route;
    }
  }

  /**
   * Apply AI optimizations to route config
   */
  private applyOptimizations(
    route: RouteConfig,
    aiRecommendations: any,
    context: RequestContext
  ): RouteConfig {
    
    const optimizedRoute = { ...route };

    // Apply context-based optimizations
    if (context.deviceInfo?.connectionSpeed === 'slow') {
      optimizedRoute.timeout = Math.min(optimizedRoute.timeout || 15000, 10000);
      optimizedRoute.cacheStrategy = 'persistent';
    }

    if (context.deviceInfo?.isMobile) {
      optimizedRoute.retryCount = Math.min(optimizedRoute.retryCount || 1, 1);
    }

    if (context.performanceHints?.preferFastResponse) {
      optimizedRoute.cacheStrategy = 'memory';
      optimizedRoute.timeout = 5000;
    }

    return optimizedRoute;
  }

  // Additional private methods for internal functionality...
  
  private isRateLimited(routeId: string): boolean {
    const route = this.routes.get(routeId);
    if (!route?.rateLimit) return false;

    const now = Date.now();
    const rateLimit = this.rateLimits.get(routeId);
    
    if (!rateLimit || now > rateLimit.resetTime) {
      this.rateLimits.set(routeId, {
        count: 1,
        resetTime: now + route.rateLimit.windowMs
      });
      return false;
    }

    if (rateLimit.count >= route.rateLimit.requests) {
      return true;
    }

    rateLimit.count++;
    return false;
  }

  private getCachedResponse<T>(routeId: string, data?: any): T | null {
    const cacheKey = this.generateCacheKey(routeId, data);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    return null;
  }

  private cacheResponse(routeId: string, data: any, response: any): void {
    const route = this.routes.get(routeId);
    if (!route || route.cacheStrategy === 'none') return;

    const cacheKey = this.generateCacheKey(routeId, data);
    const ttl = this.getCacheTTL(route.cacheStrategy);
    
    this.cache.set(cacheKey, {
      data: response,
      expiry: Date.now() + ttl
    });
  }

  private generateCacheKey(routeId: string, data?: any): string {
    const dataHash = data ? btoa(JSON.stringify(data)).slice(0, 8) : '';
    return `${routeId}${dataHash}`;
  }

  private getCacheTTL(strategy: string): number {
    switch (strategy) {
      case 'memory': return 5 * 60 * 1000; // 5 minutes
      case 'session': return 30 * 60 * 1000; // 30 minutes  
      case 'persistent': return 24 * 60 * 60 * 1000; // 24 hours
      default: return 0;
    }
  }

  private async executeRequest(
    config: RouteConfig,
    data?: any,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    
    const requestConfig: AxiosRequestConfig = {
      url: config.endpoint,
      method: config.method,
      timeout: config.timeout,
      ...options
    };

    if (data) {
      if (config.method === 'GET') {
        requestConfig.params = data;
      } else {
        requestConfig.data = data;
      }
    }

    return this.client.request(requestConfig);
  }

  private recordMetrics(routeId: string, duration: number, success: boolean): void {
    const metrics = this.performanceMetrics.get(routeId);
    if (!metrics) return;

    // Update performance metrics with exponential smoothing
    const alpha = 0.1; // Smoothing factor
    metrics.averageResponseTime = metrics.averageResponseTime * (1 - alpha) + duration * alpha;
    metrics.successRate = metrics.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
    metrics.errorRate = metrics.errorRate * (1 - alpha) + (success ? 0 : 1) * alpha;
    metrics.lastUsed = new Date();
  }

  private async retryRequest<T>(
    routeId: string,
    data: any,
    context: RequestContext | undefined,
    options: AxiosRequestConfig | undefined,
    retriesLeft: number
  ): Promise<T> {
    
    if (retriesLeft <= 0) {
      throw new Error(`Max retries exceeded for route ${routeId}`);
    }

    // Exponential backoff
    const delay = Math.pow(2, (this.routes.get(routeId)?.retryCount || 1) - retriesLeft) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const route = this.routes.get(routeId)!;
    const updatedRoute = { ...route, retryCount: retriesLeft - 1 };
    
    return this.request<T>(routeId, data, context, options);
  }

  private groupRequestsByPriority(requests: Array<any>): Map<string, Array<any>> {
    const grouped = new Map<string, Array<any>>();
    
    for (const request of requests) {
      const route = this.routes.get(request.routeId);
      const priority = route?.priority || 'medium';
      
      if (!grouped.has(priority)) {
        grouped.set(priority, []);
      }
      grouped.get(priority)!.push(request);
    }
    
    return grouped;
  }

  private async executeBatchParallel<T>(
    requests: Array<any>,
    maxConcurrency: number
  ): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
    
    const results: Array<{ success: boolean; data?: T; error?: Error }> = [];
    const chunks = this.chunkArray(requests, maxConcurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (req) => {
        try {
          const data = await this.request<T>(req.routeId, req.data, req.context);
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    return results;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private parsePerformanceRecommendations(aiAnalysis: any): Partial<RouteConfig> {
    // Parse AI recommendations into route config updates
    const recommendations: Partial<RouteConfig> = {};
    
    if (aiAnalysis.recommendedTimeout) {
      recommendations.timeout = aiAnalysis.recommendedTimeout;
    }
    
    if (aiAnalysis.cacheStrategy) {
      recommendations.cacheStrategy = aiAnalysis.cacheStrategy;
    }
    
    return recommendations;
  }

  private calculateExpectedImprovement(
    metrics: RoutePerformanceMetrics,
    changes: Partial<RouteConfig>
  ): number {
    // Simple improvement calculation - in production this would be more sophisticated
    let improvement = 0;
    
    if (changes.timeout && changes.timeout < 15000) {
      improvement += 0.1; // 10% improvement expected
    }
    
    if (changes.cacheStrategy && changes.cacheStrategy !== 'none') {
      improvement += 0.2; // 20% improvement expected
    }
    
    return improvement;
  }

  private calculateOverallPerformanceScore(analytics: Record<string, any>): number {
    const routes = Object.values(analytics);
    if (routes.length === 0) return 0;
    
    const avgSuccessRate = routes.reduce((sum, route) => sum + route.successRate, 0) / routes.length;
    const avgResponseTime = routes.reduce((sum, route) => sum + route.averageResponseTime, 0) / routes.length;
    
    // Score based on success rate and response time (lower is better for response time)
    const successScore = avgSuccessRate * 50; // 0-50 points
    const speedScore = Math.max(0, 50 - (avgResponseTime / 1000) * 10); // 0-50 points
    
    return Math.round(successScore + speedScore);
  }
}

// Export singleton instance
export const apiRouteManager = new APIRouteManager();

// Helper functions
export const apiRequest = <T = any>(
  routeId: string,
  data?: any,
  context?: RequestContext,
  options?: AxiosRequestConfig
): Promise<T> => {
  return apiRouteManager.request<T>(routeId, data, context, options);
};

export const apiBatchRequest = <T = any>(
  requests: Array<{
    routeId: string;
    data?: any;
    context?: RequestContext;
  }>,
  options?: {
    parallel?: boolean;
    maxConcurrency?: number;
    failFast?: boolean;
  }
): Promise<Array<{ success: boolean; data?: T; error?: Error }>> => {
  return apiRouteManager.batchRequest<T>(requests, options);
};

export default apiRouteManager;
