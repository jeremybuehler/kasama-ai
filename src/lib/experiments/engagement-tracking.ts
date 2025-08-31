/**
 * User Engagement Metrics Tracking
 * Comprehensive engagement analytics for relationship development platform
 */

import { experimentEngine } from './core';
import { UserEngagementMetrics, MetricEvent, ExperimentContext } from './types';

export interface EngagementSession {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  pageViews: string[];
  interactions: EngagementInteraction[];
  aiInteractions: AIInteractionEvent[];
  completedTasks: CompletedTask[];
  deviceInfo: DeviceInfo;
  referrer?: string;
}

export interface EngagementInteraction {
  id: string;
  type: InteractionType;
  element: string;
  timestamp: string;
  duration?: number;
  value?: number;
  metadata?: Record<string, any>;
}

export type InteractionType = 
  | 'click' 
  | 'scroll' 
  | 'hover' 
  | 'focus' 
  | 'form_submit' 
  | 'video_play' 
  | 'video_pause' 
  | 'download' 
  | 'share';

export interface AIInteractionEvent {
  id: string;
  agentType: 'assessment' | 'learning' | 'progress' | 'insight' | 'communication';
  interactionType: 'question' | 'response' | 'feedback' | 'rating';
  timestamp: string;
  duration: number;
  satisfactionRating?: number;
  followUpAction?: string;
  experimentId?: string;
  variantId?: string;
}

export interface CompletedTask {
  taskType: 'assessment' | 'practice' | 'goal_setting' | 'reflection' | 'learning_module';
  taskId: string;
  completionTime: string;
  timeSpent: number;
  completionRate: number; // 0-100%
  quality?: number; // 0-100%
  difficulty?: number; // 1-5
  helpRequested: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  screenSize: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  connectionSpeed?: string;
}

export interface EngagementKPIs {
  // Activation metrics
  onboardingCompletion: number;
  timeToFirstValue: number; // minutes
  activationRate: number;

  // Engagement metrics
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  sessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;

  // Feature usage
  assessmentCompletionRate: number;
  practiceEngagementRate: number;
  aiInteractionRate: number;
  goalSettingRate: number;

  // Quality metrics
  taskCompletionRate: number;
  helpRequestRate: number;
  errorEncounterRate: number;
  satisfactionScore: number;

  // Retention metrics
  dayOneRetention: number;
  daySevenRetention: number;
  dayThirtyRetention: number;
  churnRate: number;
}

class EngagementTracker {
  private sessions: Map<string, EngagementSession> = new Map();
  private dailyMetrics: Map<string, UserEngagementMetrics> = new Map();
  private engagementConfig = {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    heartbeatInterval: 60 * 1000, // 1 minute
    maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours
    trackScrollDepth: true,
    trackClickHeatmap: true,
    trackFormInteractions: true
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientSideTracking();
    }
  }

  /**
   * Session Management
   */
  startSession(userId: string, context: ExperimentContext): string {
    const sessionId = crypto.randomUUID();
    
    const session: EngagementSession = {
      sessionId,
      userId,
      startTime: new Date().toISOString(),
      pageViews: [context.currentPage || window.location.pathname],
      interactions: [],
      aiInteractions: [],
      completedTasks: [],
      deviceInfo: this.getDeviceInfo(),
      referrer: document.referrer || context.referrer
    };

    this.sessions.set(sessionId, session);

    // Track session start
    experimentEngine.trackEvent({
      userId,
      sessionId,
      eventType: 'engagement',
      eventName: 'session_start',
      timestamp: session.startTime,
      page: context.currentPage || 'unknown',
      properties: {
        referrer: session.referrer,
        deviceType: session.deviceInfo.deviceType,
        browser: session.deviceInfo.browser
      }
    });

    return sessionId;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = new Date().toISOString();
    const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();

    // Track session end
    experimentEngine.trackEvent({
      userId: session.userId,
      sessionId,
      eventType: 'engagement',
      eventName: 'session_end',
      timestamp: session.endTime,
      page: 'unknown',
      value: duration,
      properties: {
        duration,
        pageViews: session.pageViews.length,
        interactions: session.interactions.length,
        aiInteractions: session.aiInteractions.length,
        completedTasks: session.completedTasks.length
      }
    });

    // Update daily metrics
    this.updateDailyMetrics(session);
  }

  /**
   * Interaction Tracking
   */
  trackInteraction(
    sessionId: string,
    interaction: Omit<EngagementInteraction, 'id' | 'timestamp'>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const fullInteraction: EngagementInteraction = {
      ...interaction,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    session.interactions.push(fullInteraction);

    // Track high-value interactions
    if (this.isHighValueInteraction(interaction.type)) {
      experimentEngine.trackEngagement(
        session.userId,
        sessionId,
        {
          action: interaction.type,
          feature: interaction.element,
          value: interaction.value,
          duration: interaction.duration,
          success: true,
          metadata: interaction.metadata
        }
      );
    }
  }

  /**
   * AI Interaction Tracking
   */
  trackAIInteraction(
    sessionId: string,
    aiInteraction: Omit<AIInteractionEvent, 'id' | 'timestamp'>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const fullInteraction: AIInteractionEvent = {
      ...aiInteraction,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    session.aiInteractions.push(fullInteraction);

    // Track AI interaction event
    experimentEngine.trackEvent({
      userId: session.userId,
      sessionId,
      experimentId: aiInteraction.experimentId,
      variantId: aiInteraction.variantId,
      eventType: 'ai_interaction',
      eventName: `ai_${aiInteraction.interactionType}`,
      timestamp: fullInteraction.timestamp,
      page: 'unknown',
      component: aiInteraction.agentType,
      value: aiInteraction.satisfactionRating,
      properties: {
        agentType: aiInteraction.agentType,
        duration: aiInteraction.duration,
        followUpAction: aiInteraction.followUpAction
      }
    });
  }

  /**
   * Task Completion Tracking
   */
  trackTaskCompletion(
    sessionId: string,
    task: CompletedTask
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.completedTasks.push(task);

    // Track task completion event
    experimentEngine.trackEvent({
      userId: session.userId,
      sessionId,
      eventType: 'task_completion',
      eventName: `${task.taskType}_completed`,
      timestamp: task.completionTime,
      page: 'unknown',
      feature: task.taskType,
      value: task.completionRate,
      category: task.completionRate >= 80 ? 'success' : 'partial',
      properties: {
        taskId: task.taskId,
        timeSpent: task.timeSpent,
        quality: task.quality,
        difficulty: task.difficulty,
        helpRequested: task.helpRequested
      }
    });
  }

  /**
   * Page View Tracking
   */
  trackPageView(sessionId: string, page: string, referrer?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.pageViews.push(page);

    // Track page view
    experimentEngine.trackEvent({
      userId: session.userId,
      sessionId,
      eventType: 'navigation',
      eventName: 'page_view',
      timestamp: new Date().toISOString(),
      page,
      properties: {
        referrer,
        pageIndex: session.pageViews.length,
        isNewPage: !session.pageViews.includes(page)
      }
    });
  }

  /**
   * Real-time Engagement Analysis
   */
  getRealtimeEngagement(userId: string): {
    currentSession?: EngagementSession;
    todayMetrics: Partial<UserEngagementMetrics>;
    engagementScore: number; // 0-100
    riskFactors: string[];
    recommendations: string[];
  } {
    const currentSession = this.getCurrentSession(userId);
    const today = new Date().toDateString();
    const todayMetrics = this.dailyMetrics.get(`${userId}:${today}`) || {} as UserEngagementMetrics;

    const engagementScore = this.calculateEngagementScore(currentSession, todayMetrics);
    const riskFactors = this.identifyRiskFactors(currentSession, todayMetrics);
    const recommendations = this.generateRecommendations(engagementScore, riskFactors);

    return {
      currentSession,
      todayMetrics,
      engagementScore,
      riskFactors,
      recommendations
    };
  }

  /**
   * Engagement KPIs Calculation
   */
  calculateEngagementKPIs(timeframe: 'day' | 'week' | 'month' = 'week'): EngagementKPIs {
    // This would integrate with analytics backend for real calculation
    // For now, return structure with mock data
    return {
      onboardingCompletion: 85,
      timeToFirstValue: 12,
      activationRate: 78,
      dailyActiveUsers: 1250,
      weeklyActiveUsers: 4300,
      monthlyActiveUsers: 12800,
      sessionDuration: 18.5,
      pagesPerSession: 4.2,
      bounceRate: 0.23,
      assessmentCompletionRate: 0.72,
      practiceEngagementRate: 0.56,
      aiInteractionRate: 0.89,
      goalSettingRate: 0.41,
      taskCompletionRate: 0.84,
      helpRequestRate: 0.15,
      errorEncounterRate: 0.08,
      satisfactionScore: 4.2,
      dayOneRetention: 0.68,
      daySevenRetention: 0.42,
      dayThirtyRetention: 0.28,
      churnRate: 0.12
    };
  }

  /**
   * Cohort Analysis
   */
  getCohortAnalysis(cohortType: 'acquisition' | 'feature' | 'engagement'): {
    cohorts: Array<{
      name: string;
      size: number;
      retentionRates: number[];
      engagementScore: number;
      keyMetrics: Record<string, number>;
    }>;
  } {
    // Mock cohort data - would be calculated from real data
    return {
      cohorts: [
        {
          name: 'Week of Jan 1',
          size: 234,
          retentionRates: [100, 68, 45, 32, 28, 25, 23],
          engagementScore: 72,
          keyMetrics: {
            assessmentCompletion: 0.78,
            avgSessionTime: 22.5,
            aiInteractions: 3.4
          }
        },
        {
          name: 'Week of Jan 8',
          size: 198,
          retentionRates: [100, 71, 48, 35, 31, 28, 26],
          engagementScore: 75,
          keyMetrics: {
            assessmentCompletion: 0.82,
            avgSessionTime: 24.1,
            aiInteractions: 3.8
          }
        }
      ]
    };
  }

  /**
   * Private Helper Methods
   */
  private initializeClientSideTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const sessionId = this.getCurrentSessionId();
      
      if (sessionId && target) {
        this.trackInteraction(sessionId, {
          type: 'click',
          element: this.getElementIdentifier(target),
          metadata: {
            x: event.clientX,
            y: event.clientY,
            tagName: target.tagName,
            className: target.className
          }
        });
      }
    });

    // Track scroll depth
    if (this.engagementConfig.trackScrollDepth) {
      let maxScrollDepth = 0;
      
      window.addEventListener('scroll', () => {
        const scrollDepth = Math.round(
          (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
        );
        
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth;
          const sessionId = this.getCurrentSessionId();
          
          if (sessionId && scrollDepth % 25 === 0) {
            this.trackInteraction(sessionId, {
              type: 'scroll',
              element: 'page',
              value: scrollDepth,
              metadata: { maxDepth: maxScrollDepth }
            });
          }
        }
      });
    }

    // Track form interactions
    if (this.engagementConfig.trackFormInteractions) {
      document.addEventListener('submit', (event) => {
        const form = event.target as HTMLFormElement;
        const sessionId = this.getCurrentSessionId();
        
        if (sessionId && form) {
          this.trackInteraction(sessionId, {
            type: 'form_submit',
            element: this.getElementIdentifier(form),
            metadata: {
              formId: form.id,
              formElements: form.elements.length
            }
          });
        }
      });
    }

    // Heartbeat for session activity
    setInterval(() => {
      const sessionId = this.getCurrentSessionId();
      if (sessionId) {
        this.updateSessionActivity(sessionId);
      }
    }, this.engagementConfig.heartbeatInterval);
  }

  private getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: '',
        screenSize: '0x0',
        deviceType: 'desktop',
        browser: 'unknown',
        os: 'unknown'
      };
    }

    const ua = navigator.userAgent;
    
    return {
      userAgent: ua,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      deviceType: this.getDeviceType(ua),
      browser: this.getBrowser(ua),
      os: this.getOS(ua)
    };
  }

  private getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'unknown';
  }

  private getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'unknown';
  }

  private getElementIdentifier(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private getCurrentSessionId(): string | null {
    // In production, this would be stored in app state or context
    return sessionStorage.getItem('currentSessionId');
  }

  private getCurrentSession(userId: string): EngagementSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.endTime) {
        return session;
      }
    }
    return undefined;
  }

  private isHighValueInteraction(type: InteractionType): boolean {
    return ['form_submit', 'download', 'share', 'video_play'].includes(type);
  }

  private updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Check for session timeout
    const lastActivity = Math.max(
      ...session.interactions.map(i => new Date(i.timestamp).getTime()),
      new Date(session.startTime).getTime()
    );
    
    const timeSinceActivity = Date.now() - lastActivity;
    
    if (timeSinceActivity > this.engagementConfig.sessionTimeout) {
      this.endSession(sessionId);
    }
  }

  private updateDailyMetrics(session: EngagementSession): void {
    const date = new Date(session.startTime).toDateString();
    const key = `${session.userId}:${date}`;
    
    const existing = this.dailyMetrics.get(key) || this.createEmptyDailyMetrics(session.userId, date);
    
    // Update metrics based on session data
    existing.pageViews += session.pageViews.length;
    existing.aiInteractions += session.aiInteractions.length;
    
    if (session.endTime) {
      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      existing.sessionDuration = (existing.sessionDuration + duration / 1000) / 2; // Average
    }

    // Calculate completion rates
    const completedTasks = session.completedTasks.filter(t => t.completionRate >= 80);
    existing.taskCompletionRate = completedTasks.length / Math.max(session.completedTasks.length, 1);

    // Calculate AI satisfaction
    const aiWithRatings = session.aiInteractions.filter(ai => ai.satisfactionRating);
    if (aiWithRatings.length > 0) {
      existing.aiResponseSatisfaction = aiWithRatings.reduce((sum, ai) => sum + (ai.satisfactionRating || 0), 0) / aiWithRatings.length;
    }

    this.dailyMetrics.set(key, existing);
  }

  private createEmptyDailyMetrics(userId: string, date: string): UserEngagementMetrics {
    return {
      userId,
      sessionId: 'daily_aggregate',
      date,
      pageViews: 0,
      sessionDuration: 0,
      bounceRate: 0,
      aiInteractions: 0,
      assessmentCompletions: 0,
      practiceEngagement: 0,
      goalProgress: 0,
      taskCompletionRate: 0,
      errorRate: 0,
      helpRequests: 0,
      feedbackSubmissions: 0,
      aiResponseSatisfaction: 0,
      aiResponseTime: 0,
      aiTokenUsage: 0,
      aiCost: 0,
      returnVisits: 0,
      streakDays: 0,
      churnRisk: 0
    };
  }

  private calculateEngagementScore(session?: EngagementSession, metrics?: UserEngagementMetrics): number {
    let score = 0;
    
    if (session) {
      score += Math.min(session.interactions.length * 2, 20);
      score += Math.min(session.aiInteractions.length * 5, 25);
      score += Math.min(session.completedTasks.length * 10, 30);
    }
    
    if (metrics) {
      score += Math.min(metrics.sessionDuration / 60, 15); // Up to 15 points for 1+ hours
      score += Math.min(metrics.aiResponseSatisfaction * 2, 10); // Up to 10 points for 5-star rating
    }
    
    return Math.min(score, 100);
  }

  private identifyRiskFactors(session?: EngagementSession, metrics?: UserEngagementMetrics): string[] {
    const risks: string[] = [];
    
    if (session) {
      if (session.interactions.length < 5) risks.push('Low interaction rate');
      if (session.aiInteractions.length === 0) risks.push('No AI engagement');
      if (session.completedTasks.length === 0) risks.push('No task completion');
    }
    
    if (metrics) {
      if (metrics.sessionDuration < 300) risks.push('Short session duration'); // < 5 minutes
      if (metrics.aiResponseSatisfaction < 3) risks.push('Low AI satisfaction');
      if (metrics.errorRate > 0.1) risks.push('High error rate');
    }
    
    return risks;
  }

  private generateRecommendations(score: number, risks: string[]): string[] {
    const recommendations: string[] = [];
    
    if (score < 30) {
      recommendations.push('Encourage assessment completion');
      recommendations.push('Highlight AI coach features');
    }
    
    if (risks.includes('Low interaction rate')) {
      recommendations.push('Show interactive elements');
    }
    
    if (risks.includes('No AI engagement')) {
      recommendations.push('Prompt AI conversation starter');
    }
    
    if (risks.includes('Short session duration')) {
      recommendations.push('Suggest relevant content');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const engagementTracker = new EngagementTracker();

export default EngagementTracker;