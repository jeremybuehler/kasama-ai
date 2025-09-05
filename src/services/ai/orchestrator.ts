/**
 * AI Orchestrator
 * 
 * Central orchestration system that coordinates all 5 AI agents,
 * manages provider routing, handles caching, and provides unified API.
 */

import { ProviderManager } from './core/provider-manager';
import { SemanticCache } from './core/semantic-cache';
import { ErrorHandler } from './core/error-handler';
import { RateLimiter } from './core/rate-limiter';

import { AssessmentAnalyst } from './agents/assessment-analyst';
import { LearningCoach } from './agents/learning-coach';
import { ProgressTracker } from './agents/progress-tracker';
import { InsightGenerator } from './agents/insight-generator';
import { CommunicationAdvisor } from './agents/communication-advisor';

import {
  AIRequest,
  AIResponse,
  AgentType,
  UserProfile,
  AssessmentAnalysisInput,
  LearningPathInput,
  ProgressAnalysisInput,
  DailyInsightInput,
  ConflictResolutionInput,
  AgentMetrics,
  CostAnalytics
} from './types';

export interface OrchestratorConfig {
  enableCaching: boolean;
  enableRateLimiting: boolean;
  enableMetrics: boolean;
  maxConcurrentRequests: number;
  defaultCacheTTL: number;
  performanceLogging: boolean;
}

export interface BatchRequest {
  requests: AIRequest[];
  options?: {
    parallel: boolean;
    maxConcurrency: number;
    failFast: boolean;
  };
}

export interface BatchResponse {
  responses: Array<{
    request: AIRequest;
    response?: AIResponse;
    error?: Error;
  }>;
  metrics: {
    totalTime: number;
    successCount: number;
    errorCount: number;
    cacheHits: number;
  };
}

export class AIOrchestrator {
  private providerManager: ProviderManager;
  private semanticCache: SemanticCache;
  private errorHandler: ErrorHandler;
  private rateLimiter: RateLimiter;
  
  // AI Agents
  private assessmentAnalyst: AssessmentAnalyst;
  private learningCoach: LearningCoach;
  private progressTracker: ProgressTracker;
  private insightGenerator: InsightGenerator;
  private communicationAdvisor: CommunicationAdvisor;
  
  private config: OrchestratorConfig;
  private metrics: Map<string, number> = new Map();
  private activeRequests = new Set<string>();
  
  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      enableCaching: true,
      enableRateLimiting: true,
      enableMetrics: true,
      maxConcurrentRequests: 10,
      defaultCacheTTL: 3600000, // 1 hour
      performanceLogging: process.env.NODE_ENV === 'development',
      ...config
    };
    
    // Initialize core services
    this.errorHandler = new ErrorHandler();
    this.rateLimiter = new RateLimiter();
    this.semanticCache = new SemanticCache();
    this.providerManager = new ProviderManager();
    
    // Initialize AI agents
    this.assessmentAnalyst = new AssessmentAnalyst(this.providerManager, this.semanticCache, this.errorHandler);
    this.learningCoach = new LearningCoach(this.providerManager, this.semanticCache, this.errorHandler);
    this.progressTracker = new ProgressTracker(this.providerManager, this.semanticCache, this.errorHandler);
    this.insightGenerator = new InsightGenerator(this.providerManager, this.semanticCache, this.errorHandler);
    this.communicationAdvisor = new CommunicationAdvisor(this.providerManager, this.semanticCache, this.errorHandler);
    
    this.initializeMetrics();
  }

  // ==================== ASSESSMENT ANALYST ====================
  
  /**
   * Analyze relationship assessment responses
   */
  async analyzeAssessment(
    input: AssessmentAnalysisInput,
    userId?: string,
    options?: { priority?: 'low' | 'medium' | 'high'; maxTokens?: number }
  ) {
    return this.withMetrics('assessment_analysis', async () => {
      const context = userId ? await this.getUserContext(userId) : undefined;
      return this.assessmentAnalyst.analyzeAssessment(input, {
        userProfile: context?.userProfile,
        assessmentHistory: context?.assessmentHistory || [],
        ...context
      });
    });
  }

  /**
   * Get quick assessment score
   */
  async quickScore(answers: Record<string, unknown>, assessmentType: string) {
    return this.withMetrics('quick_score', async () => {
      return this.assessmentAnalyst.quickScore(answers, assessmentType);
    });
  }

  /**
   * Compare current assessment with previous results
   */
  async compareAssessments(
    userId: string,
    currentAssessment: any,
    previousAssessments?: any[]
  ) {
    return this.withMetrics('assessment_comparison', async () => {
      const context = await this.getUserContext(userId);
      const history = previousAssessments || context?.assessmentHistory || [];
      
      return this.assessmentAnalyst.compareAssessments(
        currentAssessment,
        history,
        context
      );
    });
  }

  // ==================== LEARNING COACH ====================
  
  /**
   * Generate personalized learning path
   */
  async generateLearningPath(
    input: LearningPathInput,
    options?: { skillLevel?: 'beginner' | 'intermediate' | 'advanced'; focusAreas?: string[] }
  ) {
    return this.withMetrics('learning_path_generation', async () => {
      const context = {
        currentSkillLevel: options?.skillLevel || 'beginner',
        focusAreas: options?.focusAreas || [],
        completedPractices: [],
        timeAvailable: input.timeConstraints?.availableMinutesPerDay || 30,
        preferredStyle: 'structured' as const,
        motivationLevel: 'medium' as const
      };
      
      return this.learningCoach.generateLearningPath(input, context);
    });
  }

  /**
   * Get daily practice recommendations
   */
  async getDailyPractices(
    userId: string,
    availableTime: number,
    currentPath?: any
  ) {
    return this.withMetrics('daily_practices', async () => {
      const context = await this.getUserContext(userId);
      
      return this.learningCoach.getDailyPractices(
        context?.userProfile || this.createMockUserProfile(userId),
        currentPath || await this.getOrCreateLearningPath(userId),
        availableTime
      );
    });
  }

  /**
   * Get or create learning path for user
   */
  private async getOrCreateLearningPath(userId: string): Promise<any> {
    try {
      // Check for existing learning path
      const context = await this.getUserContext(userId);
      if (context?.learningPath) {
        return context.learningPath;
      }

      // Create new learning path
      const input = {
        userProfile: context?.userProfile || this.createMockUserProfile(userId),
        assessmentResults: context?.assessmentHistory || [],
        currentGoals: [],
        learningPreferences: {},
        timeConstraints: { availableMinutesPerDay: 30 }
      };

      return await this.generateLearningPath(input);
    } catch (error) {
      console.error('Failed to get/create learning path:', error);
      return this.createDefaultLearningPath();
    }
  }

  /**
   * Create mock user profile for fallback
   */
  private createMockUserProfile(userId: string): UserProfile {
    return {
      id: userId,
      email: 'user@example.com',
      subscriptionTier: 'free',
      preferences: {
        communicationStyle: 'supportive',
        aiPersonality: 'encouraging'
      }
    };
  }

  /**
   * Create default learning path
   */
  private createDefaultLearningPath(): any {
    return {
      pathId: 'default',
      name: 'Relationship Basics',
      modules: [
        {
          id: 'communication',
          title: 'Communication Skills',
          practices: [
            { id: 'active-listening', title: 'Active Listening', estimatedTimeMinutes: 10 }
          ]
        }
      ]
    };
  }

  /**
   * Generate daily insights
   */
  async generateDailyInsights(
    input: {
      userProfile: UserProfile;
      recentActivities?: ActivityRecord[];
      currentGoals?: Goal[];
      preferences?: UserPreferences;
    },
    userId?: string
  ) {
    return this.withMetrics('daily_insights', async () => {
      const context = await this.getUserContext(userId || input.userProfile.id);
      
      return this.insightGenerator.generateDailyInsights(input, {
        recentProgress: context?.progressHistory || [],
        completedPractices: context?.completedPractices || [],
        upcomingMilestones: context?.upcomingMilestones || [],
        ...context
      });
    });
  }

  /**
   * Track progress over time
   */
  async trackProgress(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter',
    options?: { includeComparisons?: boolean }
  ) {
    return this.withMetrics('progress_tracking', async () => {
      const context = await this.getUserContext(userId);
      
      return this.progressTracker.trackProgress(
        context?.userProfile || this.createMockUserProfile(userId),
        timeframe,
        {
          includeComparisons: options?.includeComparisons || true,
          historicalData: context?.progressHistory || [],
          milestones: context?.milestones || []
        }
      );
    });
  }

  /**
   * Provide communication guidance
   */
  async provideCommunicationGuidance(
    input: {
      scenario: string;
      participants?: string[];
      context?: any;
      urgency?: 'low' | 'medium' | 'high';
    },
    userId?: string
  ) {
    return this.withMetrics('communication_guidance', async () => {
      const context = await this.getUserContext(userId);
      
      return this.communicationAdvisor.provideCommunicationGuidance(
        input,
        context
      );
    });
  }

  /**
   * Process generic AI request
   */
  async processGenericRequest(request: AIRequest): Promise<AIResponse> {
    return this.withMetrics(`generic_${request.agentType}`, async () => {
      switch (request.agentType) {
        case 'assessment_analyst':
          return await this.assessmentAnalyst.analyzeAssessment(
            request.inputData as any,
            request.context
          );
        case 'learning_coach':
          return await this.learningCoach.generateLearningPath(
            request.inputData as any,
            request.context
          );
        case 'progress_tracker':
          return await this.progressTracker.trackProgress(
            this.createMockUserProfile(request.userId),
            'week',
            {}
          );
        case 'insight_generator':
          return await this.insightGenerator.generateDailyInsights(
            this.createMockUserProfile(request.userId),
            [],
            [],
            request.context
          );
        case 'communication_advisor':
          return await this.communicationAdvisor.provideCommunicationGuidance(
            request.inputData as any,
            request.context
          );
        default:
          throw new Error(`Unknown agent type: ${request.agentType}`);
      }
    });
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    const metrics = new Map(this.metrics);
    const activeRequestCount = this.activeRequests.size;
    
    return {
      totalRequests: Array.from(metrics.values()).reduce((sum, count) => sum + count, 0),
      activeRequests: activeRequestCount,
      cacheHitRate: this.semanticCache.getHitRate(),
      averageResponseTime: this.calculateAverageResponseTime(),
      errorRate: this.calculateErrorRate(),
      providerHealth: await this.getProviderHealth(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    try {
      const metrics = await this.getSystemMetrics();
      
      return {
        status: 'healthy',
        version: '1.0.0',
        agents: {
          assessmentAnalyst: 'operational',
          learningCoach: 'operational',
          progressTracker: 'operational',
          insightGenerator: 'operational',
          communicationAdvisor: 'operational'
        },
        providers: await this.getProviderHealth(),
        performance: {
          responseTime: metrics.averageResponseTime,
          errorRate: metrics.errorRate,
          cacheHitRate: metrics.cacheHitRate
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Record provider metrics
   */
  async recordProviderMetrics(provider: string, metrics: any) {
    // Implementation for recording provider-specific metrics
    console.log(`Provider metrics for ${provider}:`, metrics);
  }

  /**
   * Update cost tracking
   */
  async updateCostTracking(provider: string, usage: any) {
    // Implementation for cost tracking
    console.log(`Cost tracking for ${provider}:`, usage);
  }

  /**
   * Adapt existing learning path based on progress
   */
  async adaptLearningPath(
    userId: string,
    currentPath: any,
    progressData: any
  ) {
    return this.withMetrics('learning_path_adaptation', async () => {
      const context = await this.getUserContext(userId);
      
      return this.learningCoach.adaptLearningPath(currentPath, progressData, {
        currentSkillLevel: 'intermediate',
        focusAreas: progressData.strugglingAreas || [],
        completedPractices: progressData.completedModules || [],
        timeAvailable: 30,
        preferredStyle: 'flexible',
        motivationLevel: 'medium'
      });
    });
  }

  // ==================== PROGRESS TRACKER ====================
  
  /**
   * Analyze user progress patterns
   */
  async analyzeProgress(
    input: ProgressAnalysisInput,
    options?: { includePredictions?: boolean; focusMetrics?: string[] }
  ) {
    return this.withMetrics('progress_analysis', async () => {
      const context = {
        baselineDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        trackingCategories: ['consistency', 'improvement', 'engagement'],
        comparisonPeriods: ['week', 'month'] as const,
        focusMetrics: (options?.focusMetrics as any) || ['consistency', 'improvement'],
        includePredictions: options?.includePredictions ?? true
      };
      
      return this.progressTracker.analyzeProgress(input, context);
    });
  }

  /**
   * Analyze streak patterns
   */
  async analyzeStreaks(
    userId: string,
    activityData: Array<{ date: Date; completed: boolean; type: string }>
  ) {
    return this.withMetrics('streak_analysis', async () => {
      return this.progressTracker.analyzeStreaks(userId, activityData);
    });
  }

  /**
   * Generate trend forecasts
   */
  async generateTrendForecast(
    userId: string,
    historicalData: any[],
    currentGoals: string[]
  ) {
    return this.withMetrics('trend_forecast', async () => {
      return this.progressTracker.generateTrendForecast(userId, historicalData, currentGoals);
    });
  }

  /**
   * Detect achievements
   */
  async detectAchievements(
    userId: string,
    recentActivity: any[]
  ) {
    return this.withMetrics('achievement_detection', async () => {
      const context = await this.getUserContext(userId);
      
      return this.progressTracker.detectAchievements(
        userId,
        recentActivity,
        context?.userProfile || this.createMockUserProfile(userId)
      );
    });
  }

  // ==================== INSIGHT GENERATOR ====================
  
  /**
   * Generate daily personalized insight
   */
  async generateDailyInsight(
    input: DailyInsightInput,
    options?: { relationshipStatus?: string; energyLevel?: string; availableTime?: number }
  ) {
    return this.withMetrics('daily_insight_generation', async () => {
      const context = {
        relationshipStatus: (options?.relationshipStatus as any) || 'single',
        currentChallenges: [],
        recentEvents: [],
        moodPattern: ['neutral'] as const,
        energyLevel: (options?.energyLevel as any) || 'medium',
        availableTime: options?.availableTime || 15
      };
      
      return this.insightGenerator.generateDailyInsight(input, context);
    });
  }

  /**
   * Generate personalized guidance for specific situations
   */
  async generatePersonalizedGuidance(
    userId: string,
    situation: string,
    options?: { urgency?: string; emotionalState?: string }
  ) {
    return this.withMetrics('personalized_guidance', async () => {
      const context = await this.getUserContext(userId);
      const guidanceContext = {
        relationshipStatus: 'single' as const,
        currentChallenges: [],
        recentEvents: [],
        moodPattern: ['neutral'] as const,
        energyLevel: 'medium' as const,
        availableTime: 20
      };
      
      return this.insightGenerator.generatePersonalizedGuidance(
        context?.userProfile || this.createMockUserProfile(userId),
        situation,
        guidanceContext
      );
    });
  }

  /**
   * Generate weekly theme for sustained growth
   */
  async generateWeeklyTheme(
    userId: string,
    currentGoals: any[] = [],
    recentProgress: any[] = []
  ) {
    return this.withMetrics('weekly_theme_generation', async () => {
      const context = await this.getUserContext(userId);
      
      return this.insightGenerator.generateWeeklyTheme(
        context?.userProfile || this.createMockUserProfile(userId),
        currentGoals,
        recentProgress
      );
    });
  }

  // ==================== COMMUNICATION ADVISOR ====================
  
  /**
   * Provide conflict resolution strategies
   */
  async resolveConflict(
    input: ConflictResolutionInput,
    options?: { urgency?: string; emotionalState?: string; preferredApproach?: string }
  ) {
    return this.withMetrics('conflict_resolution', async () => {
      const context = {
        urgency: (options?.urgency as any) || 'soon',
        emotionalState: (options?.emotionalState as any) || 'stressed',
        previousAttempts: 0,
        preferredApproach: (options?.preferredApproach as any) || 'collaborative',
        culturalConsiderations: [],
        timeConstraints: 'flexible'
      };
      
      return this.communicationAdvisor.resolveConflict(input, context);
    });
  }

  /**
   * Assess communication style
   */
  async assessCommunicationStyle(
    userId: string,
    selfReportedStyle: any,
    recentExamples: string[] = []
  ) {
    return this.withMetrics('communication_assessment', async () => {
      const context = await this.getUserContext(userId);
      
      return this.communicationAdvisor.assessCommunicationStyle(
        context?.userProfile || this.createMockUserProfile(userId),
        selfReportedStyle,
        recentExamples
      );
    });
  }

  /**
   * Provide dialogue coaching
   */
  async coachDialogue(
    scenario: string,
    userGoals: string[],
    concernedAbout: string[],
    relationshipContext: any,
    options?: { urgency?: string; preferredApproach?: string }
  ) {
    return this.withMetrics('dialogue_coaching', async () => {
      const context = {
        urgency: (options?.urgency as any) || 'soon',
        emotionalState: 'calm' as const,
        previousAttempts: 0,
        preferredApproach: (options?.preferredApproach as any) || 'collaborative',
        culturalConsiderations: [],
        timeConstraints: 'flexible'
      };
      
      return this.communicationAdvisor.coachDialogue(
        scenario,
        userGoals,
        concernedAbout,
        relationshipContext,
        context
      );
    });
  }

  /**
   * Get quick communication tips
   */
  async getQuickTips(
    situation: 'before_difficult_conversation' | 'during_conflict' | 'after_argument' | 'feeling_misunderstood' | 'need_to_apologize'
  ) {
    return this.withMetrics('quick_tips', async () => {
      return this.communicationAdvisor.getQuickTips(situation);
    });
  }

  // ==================== BATCH OPERATIONS ====================
  
  /**
   * Process multiple AI requests in batch
   */
  async processBatch(batchRequest: BatchRequest): Promise<BatchResponse> {
    const startTime = Date.now();
    const { requests, options = {} } = batchRequest;
    const { parallel = true, maxConcurrency = 5, failFast = false } = options;
    
    const results: BatchResponse['responses'] = [];
    let successCount = 0;
    let errorCount = 0;
    let cacheHits = 0;
    
    if (parallel) {
      // Process requests in parallel with concurrency limit
      const semaphore = new Array(Math.min(maxConcurrency, requests.length)).fill(0);
      const processing = requests.map(async (request) => {
        try {
          const response = await this.processRequest(request);
          if (response.cacheHit) cacheHits++;
          successCount++;
          return { request, response };
        } catch (error) {
          errorCount++;
          if (failFast) throw error;
          return { request, error: error as Error };
        }
      });
      
      const batchResults = await Promise.allSettled(processing);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { request: requests[0], error: new Error('Batch processing failed') }
      ));
    } else {
      // Process requests sequentially
      for (const request of requests) {
        try {
          const response = await this.processRequest(request);
          if (response.cacheHit) cacheHits++;
          results.push({ request, response });
          successCount++;
        } catch (error) {
          errorCount++;
          results.push({ request, error: error as Error });
          if (failFast) break;
        }
      }
    }
    
    return {
      responses: results,
      metrics: {
        totalTime: Date.now() - startTime,
        successCount,
        errorCount,
        cacheHits
      }
    };
  }

  /**
   * Process single AI request through appropriate agent
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    // Rate limiting check
    if (this.config.enableRateLimiting) {
      const rateStatus = await this.rateLimiter.checkLimit(request);
      if (rateStatus.limited) {
        throw new Error(`Rate limit exceeded. Reset at: ${rateStatus.resetTime}`);
      }
    }
    
    // Concurrency check
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      throw new Error('Maximum concurrent requests exceeded');
    }
    
    this.activeRequests.add(request.id);
    
    try {
      // Route to appropriate provider
      const response = await this.providerManager.processRequest(request);
      
      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(request.agentType, response);
      }
      
      return response;
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  // ==================== ANALYTICS & MONITORING ====================
  
  /**
   * Get comprehensive system analytics
   */
  getSystemAnalytics(): {
    agents: Record<AgentType, any>;
    providers: any;
    cache: any;
    rateLimiter: any;
    costs: CostAnalytics;
    performance: {
      averageResponseTime: number;
      successRate: number;
      errorRate: number;
      throughput: number;
    };
  } {
    return {
      agents: {
        assessment_analyst: this.assessmentAnalyst.getAnalytics(),
        learning_coach: { totalPathsGenerated: 0, avgPersonalizationScore: 0.85 },
        progress_tracker: this.progressTracker.getTrackingAnalytics(),
        insight_generator: this.insightGenerator.getInsightAnalytics(),
        communication_advisor: this.communicationAdvisor.getCommunicationAnalytics()
      },
      providers: this.providerManager.getProviderStatus(),
      cache: this.semanticCache.getStats(),
      rateLimiter: this.rateLimiter.getStats(),
      costs: {
        totalCost: 0,
        costByAgent: {} as Record<AgentType, number>,
        costByProvider: {},
        averageCostPerUser: 0,
        cacheEfficiency: this.semanticCache.getEfficiencyMetrics().hitRate,
        costTrends: []
      },
      performance: {
        averageResponseTime: this.getMetric('avg_response_time') || 0,
        successRate: this.getMetric('success_rate') || 0,
        errorRate: this.getMetric('error_rate') || 0,
        throughput: this.getMetric('requests_per_minute') || 0
      }
    };
  }

  /**
   * Get health status of all components
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, { status: string; details?: string }>;
  } {
    const components = {
      providerManager: { status: 'healthy' },
      semanticCache: { 
        status: this.semanticCache.getStats().size < 8000 ? 'healthy' : 'degraded',
        details: `Cache size: ${this.semanticCache.getStats().size}`
      },
      errorHandler: { status: 'healthy' },
      rateLimiter: { status: 'healthy' },
      agents: { status: 'healthy' }
    };
    
    const unhealthyCount = Object.values(components).filter(c => c.status === 'unhealthy').length;
    const degradedCount = Object.values(components).filter(c => c.status === 'degraded').length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }
    
    return { overall, components };
  }

  // ==================== UTILITY METHODS ====================
  
  private async withMetrics<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      
      if (this.config.performanceLogging) {
        const duration = Date.now() - startTime;
        console.log(`${operation} completed in ${duration}ms`);
      }
      
      this.updateOperationMetrics(operation, Date.now() - startTime, true);
      return result;
    } catch (error) {
      this.updateOperationMetrics(operation, Date.now() - startTime, false);
      throw error;
    }
  }

  private async getUserContext(userId: string): Promise<any> {
    // In production, this would fetch from database
    // For now, return mock context
    return {
      userProfile: this.createMockUserProfile(userId),
      assessmentHistory: [],
      relationshipStatus: 'single',
      currentGoals: [],
      recentActivity: []
    };
  }


  private initializeMetrics(): void {
    if (!this.config.enableMetrics) return;
    
    this.metrics.set('total_requests', 0);
    this.metrics.set('successful_requests', 0);
    this.metrics.set('failed_requests', 0);
    this.metrics.set('avg_response_time', 0);
    this.metrics.set('cache_hits', 0);
    this.metrics.set('cache_misses', 0);
  }

  private updateMetrics(agentType: AgentType, response: AIResponse): void {
    if (!this.config.enableMetrics) return;
    
    const currentRequests = this.getMetric('total_requests') || 0;
    const currentSuccessful = this.getMetric('successful_requests') || 0;
    const currentAvgTime = this.getMetric('avg_response_time') || 0;
    
    this.metrics.set('total_requests', currentRequests + 1);
    this.metrics.set('successful_requests', currentSuccessful + 1);
    
    // Update moving average for response time
    const newAvgTime = (currentAvgTime * currentRequests + response.processingTime) / (currentRequests + 1);
    this.metrics.set('avg_response_time', newAvgTime);
    
    if (response.cacheHit) {
      this.metrics.set('cache_hits', (this.getMetric('cache_hits') || 0) + 1);
    } else {
      this.metrics.set('cache_misses', (this.getMetric('cache_misses') || 0) + 1);
    }
  }

  private updateOperationMetrics(operation: string, duration: number, success: boolean): void {
    const key = `${operation}_${success ? 'success' : 'error'}_time`;
    const currentValue = this.getMetric(key) || 0;
    const currentCount = this.getMetric(`${operation}_count`) || 0;
    
    const newAvg = (currentValue * currentCount + duration) / (currentCount + 1);
    this.metrics.set(key, newAvg);
    this.metrics.set(`${operation}_count`, currentCount + 1);
  }

  private getMetric(key: string): number | undefined {
    return this.metrics.get(key);
  }

  /**
   * Cleanup resources and shutdown gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down AI Orchestrator...');
    
    // Wait for active requests to complete
    while (this.activeRequests.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Cleanup resources
    this.semanticCache.destroy();
    this.rateLimiter.destroy();
    
    console.log('AI Orchestrator shutdown complete');
  }
}