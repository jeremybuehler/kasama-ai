/**
 * Experiment Tracking Core Engine
 * Handles feature flags, A/B testing, and user assignments
 */

import { 
  Experiment, 
  ExperimentAssignment, 
  ExperimentContext, 
  ExperimentConfig,
  FeatureFlag,
  MetricEvent,
  ExperimentError
} from './types';

class ExperimentEngine {
  private config: ExperimentConfig;
  private assignments: Map<string, ExperimentAssignment> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private eventQueue: MetricEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: ExperimentConfig) {
    this.config = config;
    this.initializeEventFlushing();
  }

  /**
   * Feature Flag Management
   */
  async evaluateFeatureFlag(
    flagId: string, 
    context: ExperimentContext,
    defaultValue: boolean = false
  ): Promise<boolean> {
    try {
      const flag = this.featureFlags.get(flagId);
      if (!flag) return defaultValue;
      
      if (!flag.enabled) return false;
      
      // Check environment
      if (flag.environment !== this.config.environment) return false;
      
      // Check audience targeting
      if (flag.targetAudience && !this.matchesAudience(context, flag.targetAudience)) {
        return false;
      }
      
      // Check rollout percentage
      const userHash = this.hashUser(context.userId, flagId);
      const userPercentile = userHash % 100;
      
      return userPercentile < flag.rolloutPercentage;
    } catch (error) {
      this.logError({
        type: 'assignment',
        message: `Feature flag evaluation failed: ${error.message}`,
        experimentId: flagId,
        userId: context.userId,
        timestamp: new Date().toISOString(),
        metadata: { flagId, error: error.message }
      });
      return defaultValue;
    }
  }

  /**
   * Experiment Assignment
   */
  async assignUserToExperiment(
    experimentId: string,
    context: ExperimentContext
  ): Promise<string | null> {
    try {
      // Check for existing assignment
      const existingAssignment = this.getExistingAssignment(experimentId, context.userId);
      if (existingAssignment) {
        return existingAssignment.variantId;
      }

      const experiment = await this.getExperiment(experimentId);
      if (!experiment || experiment.status !== 'running') return null;

      // Check if user should be included
      if (!this.shouldIncludeUser(experiment, context)) return null;

      // Assign variant
      const variantId = this.selectVariant(experiment, context.userId);
      if (!variantId) return null;

      // Save assignment
      const assignment: ExperimentAssignment = {
        userId: context.userId,
        experimentId,
        variantId,
        assignedAt: new Date().toISOString(),
        sessionId: context.sessionId,
        sticky: true
      };

      this.assignments.set(`${context.userId}:${experimentId}`, assignment);
      
      // Track assignment event
      this.trackEvent({
        id: crypto.randomUUID(),
        userId: context.userId,
        sessionId: context.sessionId,
        experimentId,
        variantId,
        eventType: 'system',
        eventName: 'experiment_assignment',
        timestamp: new Date().toISOString(),
        page: context.currentPage || 'unknown',
        properties: { assignment: 'new' }
      });

      return variantId;
    } catch (error) {
      this.logError({
        type: 'assignment',
        message: `Experiment assignment failed: ${error.message}`,
        experimentId,
        userId: context.userId,
        timestamp: new Date().toISOString(),
        metadata: { error: error.message }
      });
      return null;
    }
  }

  /**
   * Event Tracking
   */
  trackEvent(event: Omit<MetricEvent, 'id'>): void {
    const fullEvent: MetricEvent = {
      ...event,
      id: crypto.randomUUID()
    };

    this.eventQueue.push(fullEvent);

    if (this.eventQueue.length >= this.config.eventBatchSize) {
      this.flushEvents();
    }
  }

  /**
   * AI-Specific Tracking
   */
  trackAIResponse(
    userId: string,
    sessionId: string,
    experimentId: string | undefined,
    variantId: string | undefined,
    metrics: {
      provider: string;
      responseTime: number;
      tokenCount: number;
      cost: number;
      satisfaction?: number;
      component: string;
    }
  ): void {
    this.trackEvent({
      userId,
      sessionId,
      experimentId,
      variantId,
      eventType: 'ai_interaction',
      eventName: 'ai_response',
      timestamp: new Date().toISOString(),
      page: 'unknown',
      component: metrics.component,
      aiProvider: metrics.provider,
      responseTime: metrics.responseTime,
      tokenCount: metrics.tokenCount,
      cost: metrics.cost,
      satisfaction: metrics.satisfaction,
      properties: metrics
    });
  }

  /**
   * User Engagement Tracking
   */
  trackEngagement(
    userId: string,
    sessionId: string,
    engagementData: {
      action: string;
      feature: string;
      value?: number;
      duration?: number;
      success: boolean;
      metadata?: Record<string, any>;
    }
  ): void {
    // Get user's current experiment assignments
    const assignments = this.getUserAssignments(userId);
    
    assignments.forEach(assignment => {
      this.trackEvent({
        userId,
        sessionId,
        experimentId: assignment.experimentId,
        variantId: assignment.variantId,
        eventType: 'engagement',
        eventName: engagementData.action,
        timestamp: new Date().toISOString(),
        page: 'unknown',
        feature: engagementData.feature,
        value: engagementData.value,
        category: engagementData.success ? 'success' : 'failure',
        properties: {
          duration: engagementData.duration,
          success: engagementData.success,
          ...engagementData.metadata
        }
      });
    });
  }

  /**
   * Private Methods
   */
  private getExistingAssignment(experimentId: string, userId: string): ExperimentAssignment | null {
    return this.assignments.get(`${userId}:${experimentId}`) || null;
  }

  private async getExperiment(experimentId: string): Promise<Experiment | null> {
    // In production, this would fetch from a database or API
    // For now, return mock experiment
    return {
      id: experimentId,
      name: 'Mock Experiment',
      status: 'running',
      trafficAllocation: 100,
      audienceSegments: [],
      variants: [
        { id: 'control', name: 'Control', allocation: 50, config: {}, isControl: true },
        { id: 'variant', name: 'Variant', allocation: 50, config: {}, isControl: false }
      ]
    } as Experiment;
  }

  private shouldIncludeUser(experiment: Experiment, context: ExperimentContext): boolean {
    // Check traffic allocation
    const userHash = this.hashUser(context.userId, experiment.id);
    const userPercentile = userHash % 100;
    
    if (userPercentile >= experiment.trafficAllocation) return false;

    // Check audience segments
    if (experiment.audienceSegments.length > 0) {
      return this.matchesAudience(context, experiment.audienceSegments);
    }

    return true;
  }

  private selectVariant(experiment: Experiment, userId: string): string | null {
    const userHash = this.hashUser(userId, experiment.id);
    const userPercentile = userHash % 100;
    
    let cumulativeAllocation = 0;
    
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (userPercentile < cumulativeAllocation) {
        return variant.id;
      }
    }
    
    return null;
  }

  private matchesAudience(context: ExperimentContext, segments: any[]): boolean {
    // Implement audience matching logic based on segments
    // This is a simplified version
    return true;
  }

  private hashUser(userId: string, salt: string): number {
    // Simple hash function - in production, use a cryptographic hash
    const combined = `${userId}:${salt}:${this.config.hashSalt}`;
    let hash = 0;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  private getUserAssignments(userId: string): ExperimentAssignment[] {
    const assignments: ExperimentAssignment[] = [];
    
    for (const [key, assignment] of this.assignments) {
      if (assignment.userId === userId) {
        assignments.push(assignment);
      }
    }
    
    return assignments;
  }

  private initializeEventFlushing(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.config.eventFlushInterval);
  }

  private flushEvents(): void {
    const events = [...this.eventQueue];
    this.eventQueue.length = 0;

    // In production, send to analytics backend
    if (typeof window !== 'undefined') {
      console.log(`[Experiments] Flushing ${events.length} events:`, events);
      
      // Store in localStorage for now (replace with real backend)
      const existingEvents = JSON.parse(localStorage.getItem('experiment_events') || '[]');
      localStorage.setItem('experiment_events', JSON.stringify([...existingEvents, ...events]));
    }
  }

  private logError(error: ExperimentError): void {
    console.error('[Experiments]', error);
    
    // In production, send to error monitoring service
    if (typeof window !== 'undefined') {
      const existingErrors = JSON.parse(localStorage.getItem('experiment_errors') || '[]');
      localStorage.setItem('experiment_errors', JSON.stringify([...existingErrors, error]));
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushEvents(); // Flush remaining events
  }
}

// Default configuration
export const defaultExperimentConfig: ExperimentConfig = {
  hashSalt: 'kasama-experiments',
  assignmentCookieExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
  defaultConfidenceLevel: 95,
  defaultMinSampleSize: 1000,
  defaultRuntime: 14,
  enableAutoMetrics: true,
  eventBatchSize: 10,
  eventFlushInterval: 30000, // 30 seconds
  trackAIMetrics: true,
  aiCostTracking: true,
  aiSatisfactionSurveys: true,
  respectDNT: true,
  enableGDPRMode: false,
  dataRetentionDays: 90,
  enableClientSideCaching: true,
  cacheExpiryMinutes: 15
};

// Export singleton instance
export const experimentEngine = new ExperimentEngine(defaultExperimentConfig);

export default ExperimentEngine;