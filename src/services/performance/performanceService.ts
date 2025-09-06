import { supabase } from '../supabase';
import { logger } from '../utils/logger';
import { semanticCache } from '../utils/semanticCache';

export interface PerformanceMetrics {
  id: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  timestamp: Date;
  memoryUsage: number;
  cacheHit: boolean;
  dbQueryCount: number;
  dbQueryTime: number;
}

export interface CacheStrategy {
  key: string;
  ttl: number; // Time to live in seconds
  strategy: 'lru' | 'lfu' | 'fifo' | 'semantic';
  maxSize?: number;
  compression?: boolean;
}

export interface DatabaseOptimization {
  queryType: 'select' | 'insert' | 'update' | 'delete';
  table: string;
  indexRecommendations: string[];
  queryPlan: any;
  estimatedCost: number;
  executionTime: number;
  optimizationSuggestions: string[];
}

export interface CDNConfiguration {
  enabled: boolean;
  provider: 'cloudflare' | 'aws' | 'google' | 'fastly';
  regions: string[];
  cacheRules: {
    pattern: string;
    ttl: number;
    compress: boolean;
  }[];
}

class PerformanceService {
  private performanceObserver: PerformanceObserver | null = null;
  private cdnConfig: CDNConfiguration = {
    enabled: false,
    provider: 'cloudflare',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
    cacheRules: [
      { pattern: '/static/*', ttl: 86400, compress: true }, // 24 hours
      { pattern: '/api/public/*', ttl: 3600, compress: true }, // 1 hour
      { pattern: '/images/*', ttl: 604800, compress: false }, // 1 week
    ]
  };

  constructor() {
    this.initializePerformanceMonitoring();
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceEntry(entry);
        }
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'resource', 'measure', 'paint']
      });
    }
  }

  // Record performance entry
  private async recordPerformanceEntry(entry: PerformanceEntry): Promise<void> {
    try {
      const perfMetric = {
        id: crypto.randomUUID(),
        endpoint: entry.name,
        method: 'GET', // Default, would need to be determined from context
        response_time: entry.duration,
        status_code: 200, // Default, would need to be determined from context
        timestamp: new Date(),
        memory_usage: (performance as any).memory?.usedJSHeapSize || 0,
        cache_hit: false, // Would be determined from cache service
        db_query_count: 0,
        db_query_time: 0
      };

      // Store in database asynchronously to avoid blocking
      setTimeout(() => {
        supabase.from('performance_metrics').insert(perfMetric);
      }, 0);

    } catch (error) {
      logger.error('Failed to record performance entry', { error, entry: entry.name });
    }
  }

  // Advanced AI Response Caching
  async cacheAIResponse(
    userId: string,
    prompt: string,
    response: any,
    metadata: {
      agentType: string;
      model: string;
      tokenCount: number;
      cost: number;
    }
  ): Promise<void> {
    try {
      // Use semantic similarity for intelligent caching
      const cacheKey = await semanticCache.generateSemanticKey(prompt, {
        userId,
        agentType: metadata.agentType,
        model: metadata.model
      });

      const cacheData = {
        response,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          userId
        }
      };

      await semanticCache.set(
        cacheKey,
        cacheData,
        3600, // 1 hour TTL
        true // Enable compression
      );

      // Record cache storage metrics
      await this.recordCacheMetrics('store', cacheKey, metadata.tokenCount);
      
      logger.debug('AI response cached', { userId, agentType: metadata.agentType, cacheKey });
    } catch (error) {
      logger.error('Failed to cache AI response', { error, userId, agentType: metadata.agentType });
    }
  }

  // Retrieve cached AI response with semantic similarity
  async getCachedAIResponse(
    userId: string,
    prompt: string,
    agentType: string,
    similarityThreshold: number = 0.85
  ): Promise<any | null> {
    try {
      const result = await semanticCache.getSimilar(
        prompt,
        { userId, agentType },
        similarityThreshold
      );

      if (result) {
        await this.recordCacheMetrics('hit', result.key, 0);
        logger.debug('AI response cache hit', { userId, agentType, similarity: result.similarity });
        return result.value.response;
      }

      await this.recordCacheMetrics('miss', '', 0);
      return null;
    } catch (error) {
      logger.error('Failed to get cached AI response', { error, userId, agentType });
      return null;
    }
  }

  // Database Query Optimization
  async optimizeQuery(
    query: string,
    params: any[] = []
  ): Promise<DatabaseOptimization> {
    try {
      // Analyze query performance using EXPLAIN
      const { data: queryPlan } = await supabase.rpc('explain_query', {
        query_text: query,
        params
      });

      // Extract table information
      const tables = this.extractTablesFromQuery(query);
      const queryType = this.getQueryType(query);

      // Generate optimization recommendations
      const indexRecommendations = await this.generateIndexRecommendations(tables, query);
      const optimizationSuggestions = this.generateOptimizationSuggestions(query, queryPlan);

      return {
        queryType,
        table: tables[0] || 'unknown',
        indexRecommendations,
        queryPlan,
        estimatedCost: queryPlan?.cost || 0,
        executionTime: queryPlan?.execution_time || 0,
        optimizationSuggestions
      };
    } catch (error) {
      logger.error('Failed to optimize query', { error, query });
      throw error;
    }
  }

  // Connection Pooling and Database Scaling
  async optimizeConnectionPool(): Promise<void> {
    try {
      // Monitor current connection usage
      const { data: connectionStats } = await supabase.rpc('get_connection_stats');
      
      if (connectionStats) {
        const utilizationPercent = (connectionStats.active_connections / connectionStats.max_connections) * 100;
        
        if (utilizationPercent > 80) {
          logger.warn('High database connection utilization', { 
            utilization: utilizationPercent,
            active: connectionStats.active_connections,
            max: connectionStats.max_connections
          });
          
          // Implement connection pooling optimization
          await this.scaleConnectionPool(connectionStats);
        }
      }
    } catch (error) {
      logger.error('Failed to optimize connection pool', { error });
    }
  }

  // CDN Configuration and Management
  async configureCDN(config: Partial<CDNConfiguration>): Promise<void> {
    try {
      this.cdnConfig = { ...this.cdnConfig, ...config };
      
      // Update CDN cache rules
      await this.updateCDNCacheRules(this.cdnConfig.cacheRules);
      
      // Enable compression for static assets
      if (config.enabled) {
        await this.enableCDNCompression();
      }
      
      logger.info('CDN configuration updated', { config: this.cdnConfig });
    } catch (error) {
      logger.error('Failed to configure CDN', { error, config });
    }
  }

  // Static Asset Optimization
  async optimizeStaticAssets(): Promise<void> {
    try {
      // Implement image optimization
      await this.optimizeImages();
      
      // Bundle and minify JavaScript/CSS
      await this.optimizeWebAssets();
      
      // Enable gzip compression
      await this.enableCompression();
      
      logger.info('Static assets optimized');
    } catch (error) {
      logger.error('Failed to optimize static assets', { error });
    }
  }

  // Memory Management and Garbage Collection
  async optimizeMemoryUsage(): Promise<void> {
    try {
      // Clear expired cache entries
      await semanticCache.cleanup();
      
      // Monitor memory usage
      if (typeof window !== 'undefined' && (performance as any).memory) {
        const memInfo = (performance as any).memory;
        const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
        
        if (usagePercent > 80) {
          logger.warn('High memory usage detected', {
            used: memInfo.usedJSHeapSize,
            limit: memInfo.jsHeapSizeLimit,
            percentage: usagePercent
          });
          
          // Trigger garbage collection if available
          if (window.gc) {
            window.gc();
          }
        }
      }
      
      // Clean up large objects and event listeners
      await this.cleanupMemory();
      
    } catch (error) {
      logger.error('Failed to optimize memory usage', { error });
    }
  }

  // Load Balancing and Horizontal Scaling
  async checkScalingNeeds(): Promise<void> {
    try {
      // Monitor system metrics
      const metrics = await this.getSystemMetrics();
      
      // CPU utilization check
      if (metrics.cpuUsage > 80) {
        await this.triggerScaling('cpu_high', metrics);
      }
      
      // Memory utilization check
      if (metrics.memoryUsage > 85) {
        await this.triggerScaling('memory_high', metrics);
      }
      
      // Response time check
      if (metrics.avgResponseTime > 2000) { // 2 seconds
        await this.triggerScaling('response_time_high', metrics);
      }
      
      // Request queue length check
      if (metrics.queueLength > 1000) {
        await this.triggerScaling('queue_high', metrics);
      }
      
    } catch (error) {
      logger.error('Failed to check scaling needs', { error });
    }
  }

  // Performance Analytics and Reporting
  async getPerformanceReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<any> {
    try {
      const baseQuery = supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());
      
      if (userId) {
        baseQuery.eq('user_id', userId);
      }
      
      const { data: metrics, error } = await baseQuery;
      if (error) throw error;
      
      // Calculate performance statistics
      const stats = this.calculatePerformanceStats(metrics || []);
      
      // Get cache performance
      const cacheStats = await semanticCache.getStats();
      
      return {
        period: {
          start: startDate,
          end: endDate
        },
        performance: stats,
        cache: cacheStats,
        recommendations: await this.generatePerformanceRecommendations(stats)
      };
    } catch (error) {
      logger.error('Failed to generate performance report', { error, startDate, endDate });
      throw error;
    }
  }

  // Private helper methods
  private extractTablesFromQuery(query: string): string[] {
    const tableRegex = /(?:FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    const matches = Array.from(query.matchAll(tableRegex));
    return matches.map(match => match[1].toLowerCase());
  }

  private getQueryType(query: string): 'select' | 'insert' | 'update' | 'delete' {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'select';
    if (trimmed.startsWith('insert')) return 'insert';
    if (trimmed.startsWith('update')) return 'update';
    if (trimmed.startsWith('delete')) return 'delete';
    return 'select'; // default
  }

  private async generateIndexRecommendations(tables: string[], query: string): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Analyze WHERE clauses for index opportunities
    const whereRegex = /WHERE\s+([^GROUP|ORDER|HAVING|LIMIT]+)/gi;
    const whereMatch = whereRegex.exec(query);
    
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columnRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*[=<>]/g;
      const columns = Array.from(whereClause.matchAll(columnRegex));
      
      for (const table of tables) {
        for (const columnMatch of columns) {
          const column = columnMatch[1];
          recommendations.push(`CREATE INDEX IF NOT EXISTS idx_${table}_${column} ON ${table} (${column});`);
        }
      }
    }
    
    return recommendations;
  }

  private generateOptimizationSuggestions(query: string, queryPlan: any): string[] {
    const suggestions: string[] = [];
    
    // Check for SELECT * queries
    if (query.includes('SELECT *')) {
      suggestions.push('Avoid SELECT * queries. Select only required columns.');
    }
    
    // Check for missing WHERE clause on large tables
    if (!query.includes('WHERE') && !query.includes('LIMIT')) {
      suggestions.push('Consider adding WHERE clause or LIMIT to avoid full table scans.');
    }
    
    // Check for N+1 query patterns
    if (query.includes('SELECT') && query.includes('IN (')) {
      suggestions.push('Consider using JOIN instead of IN clause for better performance.');
    }
    
    // Check for complex subqueries
    const subqueryCount = (query.match(/SELECT/gi) || []).length;
    if (subqueryCount > 2) {
      suggestions.push('Consider breaking down complex subqueries or using CTEs for better readability and performance.');
    }
    
    return suggestions;
  }

  private async recordCacheMetrics(operation: 'hit' | 'miss' | 'store', key: string, size: number): Promise<void> {
    try {
      await supabase.from('cache_metrics').insert({
        id: crypto.randomUUID(),
        operation,
        cache_key: key,
        size_bytes: size,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to record cache metrics', { error, operation, key });
    }
  }

  private async scaleConnectionPool(stats: any): Promise<void> {
    // Implementation would depend on database provider and infrastructure
    logger.info('Scaling connection pool', { currentStats: stats });
  }

  private async updateCDNCacheRules(rules: any[]): Promise<void> {
    // Implementation would depend on CDN provider
    logger.info('Updating CDN cache rules', { rules });
  }

  private async enableCDNCompression(): Promise<void> {
    // Implementation would depend on CDN provider
    logger.info('Enabling CDN compression');
  }

  private async optimizeImages(): Promise<void> {
    // Implementation would include image compression, format conversion, etc.
    logger.info('Optimizing images');
  }

  private async optimizeWebAssets(): Promise<void> {
    // Implementation would include bundling, minification, tree shaking
    logger.info('Optimizing web assets');
  }

  private async enableCompression(): Promise<void> {
    // Implementation would enable gzip/brotli compression
    logger.info('Enabling compression');
  }

  private async cleanupMemory(): Promise<void> {
    // Remove expired cache entries, clear event listeners, etc.
    logger.info('Cleaning up memory');
  }

  private async getSystemMetrics(): Promise<any> {
    // Would gather system metrics from monitoring service
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      avgResponseTime: Math.random() * 3000,
      queueLength: Math.random() * 2000
    };
  }

  private async triggerScaling(reason: string, metrics: any): Promise<void> {
    logger.warn('Triggering scaling', { reason, metrics });
    // Implementation would trigger auto-scaling based on infrastructure
  }

  private calculatePerformanceStats(metrics: any[]): any {
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0
      };
    }

    const totalRequests = metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.response_time, 0) / totalRequests;
    const errorCount = metrics.filter(m => m.status_code >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;
    const cacheHits = metrics.filter(m => m.cache_hit).length;
    const cacheHitRate = (cacheHits / totalRequests) * 100;

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      p50ResponseTime: this.calculatePercentile(metrics.map(m => m.response_time), 50),
      p95ResponseTime: this.calculatePercentile(metrics.map(m => m.response_time), 95),
      p99ResponseTime: this.calculatePercentile(metrics.map(m => m.response_time), 99)
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private async generatePerformanceRecommendations(stats: any): Promise<string[]> {
    const recommendations: string[] = [];

    if (stats.avgResponseTime > 1000) {
      recommendations.push('Average response time is high. Consider implementing caching or optimizing database queries.');
    }

    if (stats.errorRate > 5) {
      recommendations.push('Error rate is elevated. Review error logs and implement better error handling.');
    }

    if (stats.cacheHitRate < 70) {
      recommendations.push('Cache hit rate is low. Review caching strategy and increase cache TTL where appropriate.');
    }

    if (stats.p99ResponseTime > 5000) {
      recommendations.push('99th percentile response time is very high. Investigate slow queries and implement performance monitoring.');
    }

    return recommendations;
  }
}

export const performanceService = new PerformanceService();
