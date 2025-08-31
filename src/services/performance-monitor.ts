import { getOptimizedSupabase } from "../lib/supabase-optimized";
import { aiOptimizer } from "./ai-performance-optimizer";

// Performance metrics interfaces
interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

interface DatabaseMetric {
  query: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  responseTime: number;
  rowsAffected?: number;
  cacheHit: boolean;
  timestamp: Date;
}

interface SystemMetric {
  type: 'memory' | 'cpu' | 'connection' | 'cache';
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface PerformanceAlert {
  id: string;
  type: 'latency' | 'error_rate' | 'resource_usage' | 'cost_threshold';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

// Performance monitoring configuration
interface MonitorConfig {
  apiLatencyThreshold: number;
  dbLatencyThreshold: number;
  errorRateThreshold: number;
  memoryThreshold: number;
  costThreshold: number;
  alertRetentionDays: number;
  metricsRetentionDays: number;
}

export class PerformanceMonitor {
  private supabase = getOptimizedSupabase();
  private metrics: {
    api: APIMetric[];
    database: DatabaseMetric[];
    system: SystemMetric[];
  } = {
    api: [],
    database: [],
    system: [],
  };
  
  private alerts: PerformanceAlert[] = [];
  private config: MonitorConfig = {
    apiLatencyThreshold: 1000, // 1 second
    dbLatencyThreshold: 500,   // 500ms
    errorRateThreshold: 0.05,  // 5% error rate
    memoryThreshold: 0.8,      // 80% memory usage
    costThreshold: 10.0,       // $10 daily cost
    alertRetentionDays: 30,
    metricsRetentionDays: 7,
  };

  private metricsBuffer: {
    api: APIMetric[];
    database: DatabaseMetric[];
    system: SystemMetric[];
  } = {
    api: [],
    database: [],
    system: [],
  };

  private flushInterval: NodeJS.Timeout;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.startMetricsCollection();
    this.startAlertMonitoring();
    
    // Flush metrics to storage every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000);
    
    // Cleanup old data every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 3600000);
  }

  /**
   * Record API performance metrics
   */
  recordAPIMetric(metric: Omit<APIMetric, 'timestamp'>): void {
    const apiMetric: APIMetric = {
      ...metric,
      timestamp: new Date(),
    };
    
    this.metricsBuffer.api.push(apiMetric);
    this.checkAPIAlerts(apiMetric);
  }

  /**
   * Record database performance metrics
   */
  recordDatabaseMetric(metric: Omit<DatabaseMetric, 'timestamp'>): void {
    const dbMetric: DatabaseMetric = {
      ...metric,
      timestamp: new Date(),
    };
    
    this.metricsBuffer.database.push(dbMetric);
    this.checkDatabaseAlerts(dbMetric);
  }

  /**
   * Record system performance metrics
   */
  recordSystemMetric(metric: Omit<SystemMetric, 'timestamp'>): void {
    const systemMetric: SystemMetric = {
      ...metric,
      timestamp: new Date(),
    };
    
    this.metricsBuffer.system.push(systemMetric);
    this.checkSystemAlerts(systemMetric);
  }

  /**
   * Create Express middleware for API monitoring
   */
  createAPIMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      
      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = (...args: any[]) => {
        const responseTime = Date.now() - startTime;
        
        this.recordAPIMetric({
          endpoint: req.route?.path || req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          userId: req.user?.id,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
        
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  /**
   * Wrap database queries with performance monitoring
   */
  wrapDatabaseQuery<T>(
    queryFn: () => Promise<T>,
    metadata: {
      table: string;
      operation: DatabaseMetric['operation'];
      query: string;
    }
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      
      try {
        const result = await queryFn();
        const responseTime = Date.now() - startTime;
        
        this.recordDatabaseMetric({
          ...metadata,
          responseTime,
          cacheHit: false, // Would be determined by query implementation
          rowsAffected: Array.isArray(result) ? result.length : 1,
        });
        
        resolve(result);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        this.recordDatabaseMetric({
          ...metadata,
          responseTime,
          cacheHit: false,
          rowsAffected: 0,
        });
        
        reject(error);
      }
    });
  }

  /**
   * Get real-time performance dashboard data
   */
  async getDashboardData(): Promise<{
    summary: {
      avgResponseTime: number;
      errorRate: number;
      throughput: number;
      cacheHitRate: number;
      aiCostToday: number;
    };
    alerts: PerformanceAlert[];
    trends: {
      responseTime: Array<{ timestamp: Date; value: number }>;
      errorRate: Array<{ timestamp: Date; value: number }>;
      throughput: Array<{ timestamp: Date; value: number }>;
    };
  }> {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Calculate metrics from recent data
    const recentAPIMetrics = this.metrics.api.filter(
      m => m.timestamp.getTime() > oneHourAgo
    );
    
    const summary = {
      avgResponseTime: this.calculateAverageResponseTime(recentAPIMetrics),
      errorRate: this.calculateErrorRate(recentAPIMetrics),
      throughput: this.calculateThroughput(recentAPIMetrics),
      cacheHitRate: this.calculateCacheHitRate(),
      aiCostToday: await this.getAICostToday(),
    };
    
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    
    const trends = {
      responseTime: this.getResponseTimeTrend(recentAPIMetrics),
      errorRate: this.getErrorRateTrend(recentAPIMetrics),
      throughput: this.getThroughputTrend(recentAPIMetrics),
    };
    
    return {
      summary,
      alerts: activeAlerts,
      trends,
    };
  }

  /**
   * Get detailed metrics for a specific time period
   */
  async getMetrics(
    startDate: Date,
    endDate: Date,
    type: 'api' | 'database' | 'system' | 'all' = 'all'
  ): Promise<{
    api?: APIMetric[];
    database?: DatabaseMetric[];
    system?: SystemMetric[];
  }> {
    const filter = (metrics: Array<{ timestamp: Date }>) =>
      metrics.filter(
        m => m.timestamp >= startDate && m.timestamp <= endDate
      );
    
    if (type === 'all') {
      return {
        api: filter(this.metrics.api) as APIMetric[],
        database: filter(this.metrics.database) as DatabaseMetric[],
        system: filter(this.metrics.system) as SystemMetric[],
      };
    } else {
      return {
        [type]: filter(this.metrics[type]),
      };
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(period: 'daily' | 'weekly' | 'monthly'): Promise<{
    period: string;
    summary: {
      totalRequests: number;
      avgResponseTime: number;
      errorRate: number;
      slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
      topErrors: Array<{ error: string; count: number }>;
      peakThroughput: number;
      aiCostTotal: number;
      cacheEfficiency: number;
    };
    recommendations: string[];
  }> {
    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    const metrics = await this.getMetrics(startDate, endDate, 'api');
    const apiMetrics = metrics.api || [];
    
    // Calculate summary statistics
    const totalRequests = apiMetrics.length;
    const avgResponseTime = this.calculateAverageResponseTime(apiMetrics);
    const errorRate = this.calculateErrorRate(apiMetrics);
    
    // Find slowest endpoints
    const endpointTimes = new Map<string, number[]>();
    apiMetrics.forEach(metric => {
      if (!endpointTimes.has(metric.endpoint)) {
        endpointTimes.set(metric.endpoint, []);
      }
      endpointTimes.get(metric.endpoint)!.push(metric.responseTime);
    });
    
    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
    
    // Count error types
    const errorCounts = new Map<string, number>();
    apiMetrics
      .filter(m => m.statusCode >= 400)
      .forEach(metric => {
        const errorType = `${metric.statusCode} - ${metric.endpoint}`;
        errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
      });
    
    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate peak throughput
    const peakThroughput = this.calculatePeakThroughput(apiMetrics);
    
    // Get AI cost data
    const costAnalytics = await aiOptimizer.getCostAnalytics(undefined, days);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      avgResponseTime,
      errorRate,
      slowestEndpoints,
      costAnalytics.cacheEfficiency
    );
    
    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      summary: {
        totalRequests,
        avgResponseTime,
        errorRate,
        slowestEndpoints,
        topErrors,
        peakThroughput,
        aiCostTotal: costAnalytics.totalCost,
        cacheEfficiency: costAnalytics.cacheEfficiency,
      },
      recommendations,
    };
  }

  /**
   * Private helper methods
   */
  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
  }

  private startAlertMonitoring(): void {
    // Check for alerts every minute
    setInterval(() => {
      this.processAlerts();
    }, 60000);
  }

  private collectSystemMetrics(): void {
    // Memory usage
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.recordSystemMetric({
        type: 'memory',
        value: memory.usedJSHeapSize / memory.totalJSHeapSize,
        unit: 'ratio',
      });
    }
    
    // Connection pool stats
    const supabaseHealth = this.supabase.getCacheStats();
    this.recordSystemMetric({
      type: 'cache',
      value: supabaseHealth.hitRate || 0,
      unit: 'ratio',
      metadata: { cacheSize: supabaseHealth.size },
    });
  }

  private checkAPIAlerts(metric: APIMetric): void {
    // High latency alert
    if (metric.responseTime > this.config.apiLatencyThreshold) {
      this.createAlert({
        type: 'latency',
        severity: metric.responseTime > this.config.apiLatencyThreshold * 2 ? 'high' : 'medium',
        message: `High API latency detected: ${metric.responseTime}ms on ${metric.endpoint}`,
        value: metric.responseTime,
        threshold: this.config.apiLatencyThreshold,
      });
    }
    
    // Error alert
    if (metric.statusCode >= 500) {
      this.createAlert({
        type: 'error_rate',
        severity: 'high',
        message: `Server error on ${metric.endpoint}: ${metric.statusCode}`,
        value: metric.statusCode,
        threshold: 500,
      });
    }
  }

  private checkDatabaseAlerts(metric: DatabaseMetric): void {
    if (metric.responseTime > this.config.dbLatencyThreshold) {
      this.createAlert({
        type: 'latency',
        severity: 'medium',
        message: `Slow database query on ${metric.table}: ${metric.responseTime}ms`,
        value: metric.responseTime,
        threshold: this.config.dbLatencyThreshold,
      });
    }
  }

  private checkSystemAlerts(metric: SystemMetric): void {
    if (metric.type === 'memory' && metric.value > this.config.memoryThreshold) {
      this.createAlert({
        type: 'resource_usage',
        severity: 'high',
        message: `High memory usage: ${(metric.value * 100).toFixed(1)}%`,
        value: metric.value,
        threshold: this.config.memoryThreshold,
      });
    }
  }

  private createAlert(
    alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>
  ): void {
    const newAlert: PerformanceAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      resolved: false,
      ...alert,
    };
    
    this.alerts.push(newAlert);
    console.warn(`🚨 Performance Alert: ${newAlert.message}`);
    
    // Could integrate with external alerting services here
    // (Slack, PagerDuty, email, etc.)
  }

  private processAlerts(): void {
    // Auto-resolve alerts that are no longer relevant
    const now = Date.now();
    const alertWindow = 5 * 60 * 1000; // 5 minutes
    
    this.alerts.forEach(alert => {
      if (alert.resolved) return;
      
      const alertAge = now - alert.timestamp.getTime();
      if (alertAge > alertWindow) {
        // Check if the condition still exists
        if (!this.isAlertConditionActive(alert)) {
          alert.resolved = true;
          console.log(`✅ Alert resolved: ${alert.message}`);
        }
      }
    });
  }

  private isAlertConditionActive(alert: PerformanceAlert): boolean {
    const recentWindow = 5 * 60 * 1000; // 5 minutes
    const cutoff = Date.now() - recentWindow;
    
    switch (alert.type) {
      case 'latency':
        const recentMetrics = this.metrics.api.filter(
          m => m.timestamp.getTime() > cutoff
        );
        const avgLatency = this.calculateAverageResponseTime(recentMetrics);
        return avgLatency > alert.threshold;
        
      case 'error_rate':
        const recentErrors = this.metrics.api.filter(
          m => m.timestamp.getTime() > cutoff && m.statusCode >= 400
        );
        const errorRate = recentErrors.length / Math.max(1, this.metrics.api.length);
        return errorRate > this.config.errorRateThreshold;
        
      default:
        return false;
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.api.length === 0 && 
        this.metricsBuffer.database.length === 0 && 
        this.metricsBuffer.system.length === 0) {
      return;
    }
    
    // Move buffer to main storage
    this.metrics.api.push(...this.metricsBuffer.api);
    this.metrics.database.push(...this.metricsBuffer.database);
    this.metrics.system.push(...this.metricsBuffer.system);
    
    // Clear buffers
    this.metricsBuffer.api = [];
    this.metricsBuffer.database = [];
    this.metricsBuffer.system = [];
    
    // In production, you might want to persist these to a time-series database
    // like InfluxDB or store them in Supabase
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000;
    
    this.metrics.api = this.metrics.api.filter(m => m.timestamp.getTime() > cutoff);
    this.metrics.database = this.metrics.database.filter(m => m.timestamp.getTime() > cutoff);
    this.metrics.system = this.metrics.system.filter(m => m.timestamp.getTime() > cutoff);
    
    const alertCutoff = Date.now() - this.config.alertRetentionDays * 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > alertCutoff);
  }

  // Calculation helper methods
  private calculateAverageResponseTime(metrics: APIMetric[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  }

  private calculateErrorRate(metrics: APIMetric[]): number {
    if (metrics.length === 0) return 0;
    const errors = metrics.filter(m => m.statusCode >= 400).length;
    return errors / metrics.length;
  }

  private calculateThroughput(metrics: APIMetric[]): number {
    if (metrics.length === 0) return 0;
    const timeSpan = Math.max(1, (Date.now() - metrics[0].timestamp.getTime()) / 1000);
    return metrics.length / timeSpan; // requests per second
  }

  private calculateCacheHitRate(): number {
    const dbMetrics = this.metrics.database.filter(m => m.timestamp.getTime() > Date.now() - 3600000);
    if (dbMetrics.length === 0) return 0;
    
    const cacheHits = dbMetrics.filter(m => m.cacheHit).length;
    return cacheHits / dbMetrics.length;
  }

  private async getAICostToday(): Promise<number> {
    const costAnalytics = await aiOptimizer.getCostAnalytics(undefined, 1);
    return costAnalytics.totalCost;
  }

  private getResponseTimeTrend(metrics: APIMetric[]): Array<{ timestamp: Date; value: number }> {
    // Group by 5-minute intervals
    const intervals = new Map<number, APIMetric[]>();
    const intervalSize = 5 * 60 * 1000; // 5 minutes
    
    metrics.forEach(metric => {
      const interval = Math.floor(metric.timestamp.getTime() / intervalSize) * intervalSize;
      if (!intervals.has(interval)) {
        intervals.set(interval, []);
      }
      intervals.get(interval)!.push(metric);
    });
    
    return Array.from(intervals.entries())
      .map(([timestamp, intervalMetrics]) => ({
        timestamp: new Date(timestamp),
        value: this.calculateAverageResponseTime(intervalMetrics),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getErrorRateTrend(metrics: APIMetric[]): Array<{ timestamp: Date; value: number }> {
    // Similar to response time trend but for error rates
    const intervals = new Map<number, APIMetric[]>();
    const intervalSize = 5 * 60 * 1000;
    
    metrics.forEach(metric => {
      const interval = Math.floor(metric.timestamp.getTime() / intervalSize) * intervalSize;
      if (!intervals.has(interval)) {
        intervals.set(interval, []);
      }
      intervals.get(interval)!.push(metric);
    });
    
    return Array.from(intervals.entries())
      .map(([timestamp, intervalMetrics]) => ({
        timestamp: new Date(timestamp),
        value: this.calculateErrorRate(intervalMetrics),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getThroughputTrend(metrics: APIMetric[]): Array<{ timestamp: Date; value: number }> {
    const intervals = new Map<number, number>();
    const intervalSize = 5 * 60 * 1000;
    
    metrics.forEach(metric => {
      const interval = Math.floor(metric.timestamp.getTime() / intervalSize) * intervalSize;
      intervals.set(interval, (intervals.get(interval) || 0) + 1);
    });
    
    return Array.from(intervals.entries())
      .map(([timestamp, count]) => ({
        timestamp: new Date(timestamp),
        value: count / (intervalSize / 1000), // requests per second
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculatePeakThroughput(metrics: APIMetric[]): number {
    const trend = this.getThroughputTrend(metrics);
    return Math.max(...trend.map(t => t.value), 0);
  }

  private generateRecommendations(
    avgResponseTime: number,
    errorRate: number,
    slowestEndpoints: Array<{ endpoint: string; avgTime: number }>,
    cacheEfficiency: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (avgResponseTime > 1000) {
      recommendations.push("Consider implementing response caching for frequently accessed endpoints");
    }
    
    if (errorRate > 0.02) {
      recommendations.push("High error rate detected - review error logs and implement better error handling");
    }
    
    if (slowestEndpoints.length > 0 && slowestEndpoints[0].avgTime > 2000) {
      recommendations.push(`Optimize ${slowestEndpoints[0].endpoint} endpoint - average response time is ${slowestEndpoints[0].avgTime}ms`);
    }
    
    if (cacheEfficiency < 0.5) {
      recommendations.push("Low cache efficiency - review caching strategy and implement semantic caching");
    }
    
    recommendations.push("Monitor AI cost trends and implement request batching to reduce expenses");
    recommendations.push("Set up automated alerts for performance degradation");
    
    return recommendations;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();