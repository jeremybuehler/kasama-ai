/**
 * Analytics Service
 * Comprehensive user behavior analytics, AI metrics tracking, and performance monitoring
 */

import { supabase } from '../../lib/supabase';
import { AIOrchestrator } from '../ai/orchestrator';

export interface UserBehaviorEvent {
  userId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  source: 'web' | 'mobile' | 'api';
  metadata?: Record<string, any>;
}

export interface AIMetricsEvent {
  userId: string;
  agentType: string;
  requestId: string;
  responseTimeMs: number;
  tokenCount: number;
  costCents: number;
  success: boolean;
  confidence?: number;
  provider: string;
  model: string;
  timestamp: Date;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  errorCount: number;
  pageViews: number;
  bounceRate: number;
  sessionDuration: number;
}

export interface AnalyticsConfig {
  enableRealTime: boolean;
  batchSize: number;
  flushInterval: number;
  enableDebugMode: boolean;
  enablePrivacyMode: boolean;
  retentionDays: number;
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: UserBehaviorEvent[] = [];
  private aiMetricsQueue: AIMetricsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private flushTimer?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enableRealTime: true,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      enableDebugMode: process.env.NODE_ENV === 'development',
      enablePrivacyMode: false,
      retentionDays: 90,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializePerformanceMonitoring();
    this.startFlushTimer();
  }

  /**
   * Initialize user session and context
   */
  async initializeUser(userId: string, properties?: Record<string, any>) {
    this.userId = userId;
    
    await this.track('user_session_start', {
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      timestamp: new Date(),
      ...properties
    });

    // Track user properties update
    if (properties) {
      await this.identifyUser(userId, properties);
    }
  }

  /**
   * Track user behavior events
   */
  async track(
    eventName: string,
    properties: Record<string, any> = {},
    options?: {
      immediate?: boolean;
      source?: 'web' | 'mobile' | 'api';
      metadata?: Record<string, any>;
    }
  ) {
    if (!this.userId && this.config.enablePrivacyMode) {
      if (this.config.enableDebugMode) {
        console.log('Analytics: Skipping event tracking in privacy mode without user');
      }
      return;
    }

    const event: UserBehaviorEvent = {
      userId: this.userId || 'anonymous',
      eventType: this.categorizeEvent(eventName),
      eventName,
      properties: this.sanitizeProperties(properties),
      timestamp: new Date(),
      sessionId: this.sessionId,
      source: options?.source || 'web',
      metadata: options?.metadata
    };

    if (options?.immediate || this.config.enableRealTime) {
      await this.sendEvent(event);
    } else {
      this.eventQueue.push(event);
    }

    if (this.config.enableDebugMode) {
      console.log('Analytics Event:', { eventName, properties, event });
    }
  }

  /**
   * Track AI agent interactions and metrics
   */
  async trackAIMetrics(metrics: Omit<AIMetricsEvent, 'userId' | 'timestamp'>) {
    if (!this.userId) return;

    const aiEvent: AIMetricsEvent = {
      ...metrics,
      userId: this.userId,
      timestamp: new Date()
    };

    if (this.config.enableRealTime) {
      await this.sendAIMetrics(aiEvent);
    } else {
      this.aiMetricsQueue.push(aiEvent);
    }

    // Track as user event as well for comprehensive analytics
    await this.track('ai_interaction', {
      agentType: metrics.agentType,
      success: metrics.success,
      responseTimeMs: metrics.responseTimeMs,
      tokenCount: metrics.tokenCount,
      provider: metrics.provider
    });
  }

  /**
   * Update user properties
   */
  async identifyUser(userId: string, properties: Record<string, any>) {
    this.userId = userId;

    try {
      await supabase
        .from('user_analytics')
        .upsert({
          user_id: userId,
          properties: this.sanitizeProperties(properties),
          last_seen: new Date().toISOString(),
          session_id: this.sessionId,
          updated_at: new Date().toISOString()
        });

      await this.track('user_identified', {
        userId,
        propertiesCount: Object.keys(properties).length
      });

    } catch (error) {
      console.error('Analytics: Failed to identify user:', error);
    }
  }

  /**
   * Track page views and navigation
   */
  async trackPageView(
    path: string,
    title?: string,
    properties?: Record<string, any>
  ) {
    await this.track('page_view', {
      path,
      title: title || document?.title,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      ...properties
    });

    // Update session with page view
    await this.updateSession({ currentPage: path });
  }

  /**
   * Track conversion events (goals, completions, etc.)
   */
  async trackConversion(
    conversionType: string,
    value?: number,
    properties?: Record<string, any>
  ) {
    await this.track('conversion', {
      conversionType,
      value,
      currency: 'USD',
      ...properties
    }, { immediate: true }); // Conversions are always sent immediately

    // Also store in conversions table for better analytics
    if (this.userId) {
      try {
        await supabase
          .from('user_conversions')
          .insert({
            user_id: this.userId,
            conversion_type: conversionType,
            value: value || 0,
            properties,
            session_id: this.sessionId,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Analytics: Failed to track conversion:', error);
      }
    }
  }

  /**
   * Track errors and exceptions
   */
  async trackError(
    error: Error | string,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? null : error.stack;

    await this.track('error_occurred', {
      errorMessage,
      errorStack,
      severity,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null
    }, { immediate: true });

    // Also send to error tracking service (like Sentry)
    if (severity === 'high' || severity === 'critical') {
      this.reportToErrorService(error, context, severity);
    }
  }

  /**
   * Get user analytics dashboard data
   */
  async getUserAnalytics(
    userId: string,
    timeframe: 'day' | 'week' | 'month' | 'quarter' = 'month'
  ) {
    try {
      const { data, error } = await supabase.rpc('get_user_engagement_metrics', {
        user_uuid: userId,
        period_days: this.timeframeToDays(timeframe)
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Analytics: Failed to get user analytics:', error);
      return null;
    }
  }

  /**
   * Get AI usage analytics
   */
  async getAIAnalytics(timeframe: 'day' | 'week' | 'month' = 'month') {
    try {
      const { data, error } = await supabase.rpc('get_ai_usage_analytics', {
        period_days: this.timeframeToDays(timeframe)
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Analytics: Failed to get AI analytics:', error);
      return null;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      const { data, error } = await supabase.rpc('get_realtime_metrics');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Analytics: Failed to get real-time metrics:', error);
      return null;
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: PerformanceMetrics) {
    this.track('performance_metrics', {
      ...metrics,
      timestamp: Date.now()
    });
  }

  /**
   * Flush queued events immediately
   */
  async flush() {
    if (this.eventQueue.length > 0) {
      await this.sendEventBatch([...this.eventQueue]);
      this.eventQueue = [];
    }

    if (this.aiMetricsQueue.length > 0) {
      await this.sendAIMetricsBatch([...this.aiMetricsQueue]);
      this.aiMetricsQueue = [];
    }
  }

  /**
   * End current session
   */
  async endSession() {
    await this.track('user_session_end', {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.getSessionStartTime()
    }, { immediate: true });

    await this.flush();
    this.cleanup();
  }

  /**
   * Private methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeEvent(eventName: string): string {
    const categories = {
      page_view: 'navigation',
      user_session_start: 'session',
      user_session_end: 'session',
      user_identified: 'user',
      conversion: 'business',
      error_occurred: 'error',
      ai_interaction: 'ai',
      practice_completed: 'engagement',
      assessment_taken: 'engagement',
      onboarding_step: 'onboarding'
    };

    // Check for pattern matches
    if (eventName.includes('click')) return 'interaction';
    if (eventName.includes('view') || eventName.includes('page')) return 'navigation';
    if (eventName.includes('complete') || eventName.includes('finish')) return 'completion';
    if (eventName.includes('error') || eventName.includes('fail')) return 'error';
    if (eventName.includes('ai_') || eventName.includes('assistant')) return 'ai';

    return categories[eventName as keyof typeof categories] || 'custom';
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      // Skip sensitive data
      if (this.isSensitiveField(key)) continue;

      // Limit string length
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth',
      'ssn', 'social', 'credit', 'card', 'bank',
      'api_key', 'private', 'confidential'
    ];

    return sensitiveFields.some(sensitive => 
      fieldName.toLowerCase().includes(sensitive)
    );
  }

  private async sendEvent(event: UserBehaviorEvent) {
    try {
      const { error } = await supabase
        .from('user_behavior_events')
        .insert({
          user_id: event.userId,
          event_type: event.eventType,
          event_name: event.eventName,
          properties: event.properties,
          session_id: event.sessionId,
          source: event.source,
          metadata: event.metadata,
          created_at: event.timestamp.toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Analytics: Failed to send event:', error);
      // Add back to queue for retry
      this.eventQueue.push(event);
    }
  }

  private async sendEventBatch(events: UserBehaviorEvent[]) {
    try {
      const { error } = await supabase
        .from('user_behavior_events')
        .insert(events.map(event => ({
          user_id: event.userId,
          event_type: event.eventType,
          event_name: event.eventName,
          properties: event.properties,
          session_id: event.sessionId,
          source: event.source,
          metadata: event.metadata,
          created_at: event.timestamp.toISOString()
        })));

      if (error) throw error;

    } catch (error) {
      console.error('Analytics: Failed to send event batch:', error);
    }
  }

  private async sendAIMetrics(metrics: AIMetricsEvent) {
    try {
      const { error } = await supabase
        .from('ai_requests')
        .insert({
          user_id: metrics.userId,
          agent_type: metrics.agentType,
          request_id: metrics.requestId,
          response_time_ms: metrics.responseTimeMs,
          token_count: metrics.tokenCount,
          cost_cents: metrics.costCents,
          success: metrics.success,
          confidence_score: metrics.confidence,
          provider: metrics.provider,
          model: metrics.model,
          created_at: metrics.timestamp.toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Analytics: Failed to send AI metrics:', error);
    }
  }

  private async sendAIMetricsBatch(metrics: AIMetricsEvent[]) {
    try {
      const { error } = await supabase
        .from('ai_requests')
        .insert(metrics.map(metric => ({
          user_id: metric.userId,
          agent_type: metric.agentType,
          request_id: metric.requestId,
          response_time_ms: metric.responseTimeMs,
          token_count: metric.tokenCount,
          cost_cents: metric.costCents,
          success: metric.success,
          confidence_score: metric.confidence,
          provider: metric.provider,
          model: metric.model,
          created_at: metric.timestamp.toISOString()
        })));

      if (error) throw error;

    } catch (error) {
      console.error('Analytics: Failed to send AI metrics batch:', error);
    }
  }

  private async updateSession(updates: Record<string, any>) {
    if (!this.userId) return;

    try {
      await supabase
        .from('user_sessions')
        .upsert({
          id: this.sessionId,
          user_id: this.userId,
          ...updates,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Analytics: Failed to update session:', error);
    }
  }

  private initializePerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformance({
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            apiResponseTime: 0, // Will be tracked separately
            errorCount: 0,
            pageViews: 1,
            bounceRate: 0,
            sessionDuration: 0
          });
        }
      }, 100);
    });

    // Track long tasks
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const longTasks = list.getEntries();
        longTasks.forEach(task => {
          if (task.duration > 50) { // Tasks longer than 50ms
            this.track('performance_long_task', {
              duration: task.duration,
              startTime: task.startTime,
              taskType: task.name
            });
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        // Long task API not supported
      }
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length >= this.config.batchSize || 
          this.aiMetricsQueue.length >= this.config.batchSize) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  private getSessionStartTime(): number {
    // Extract timestamp from session ID
    const timestamp = this.sessionId.split('_')[1];
    return parseInt(timestamp) || Date.now();
  }

  private timeframeToDays(timeframe: string): number {
    const mapping = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90
    };
    return mapping[timeframe as keyof typeof mapping] || 30;
  }

  private reportToErrorService(
    error: Error | string,
    context?: Record<string, any>,
    severity?: string
  ) {
    // Integration with Sentry or other error reporting service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: context,
        level: severity
      });
    }
  }
}

// Global analytics instance
export const analytics = new AnalyticsService();

// Convenience methods
export const trackEvent = (eventName: string, properties?: Record<string, any>) => 
  analytics.track(eventName, properties);

export const trackPageView = (path: string, title?: string, properties?: Record<string, any>) => 
  analytics.trackPageView(path, title, properties);

export const trackConversion = (type: string, value?: number, properties?: Record<string, any>) => 
  analytics.trackConversion(type, value, properties);

export const trackError = (error: Error | string, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical') => 
  analytics.trackError(error, context, severity);
