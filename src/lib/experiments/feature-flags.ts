/**
 * Feature Flag System
 * Advanced feature flag management with gradual rollouts and targeting
 */

import { experimentEngine } from './core';
import { FeatureFlag, ExperimentContext, AudienceSegment } from './types';

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluationCache: Map<string, { value: boolean; timestamp: number }> = new Map();
  private readonly cacheExpiryMs = 15 * 60 * 1000; // 15 minutes

  /**
   * Initialize with default flags for Kasama AI
   */
  constructor() {
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'ai_agent_v2',
        name: 'AI Agent Version 2',
        description: 'Enhanced AI agent with improved response quality',
        enabled: true,
        rolloutPercentage: 10,
        environment: 'production',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        tags: ['ai', 'backend']
      },
      {
        id: 'assessment_flow_redesign',
        name: 'Assessment Flow Redesign',
        description: 'New streamlined assessment flow with better UX',
        enabled: true,
        rolloutPercentage: 25,
        environment: 'production',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        tags: ['ui', 'assessment']
      },
      {
        id: 'premium_features',
        name: 'Premium Features',
        description: 'Advanced coaching features for premium users',
        enabled: true,
        rolloutPercentage: 100,
        targetAudience: [
          {
            type: 'user_type',
            criteria: { subscription: 'premium' },
            name: 'Premium Users'
          }
        ],
        environment: 'production',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        tags: ['premium', 'monetization']
      },
      {
        id: 'new_dashboard_layout',
        name: 'New Dashboard Layout',
        description: 'Redesigned dashboard with improved navigation',
        enabled: false,
        rolloutPercentage: 0,
        environment: 'development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        tags: ['ui', 'dashboard']
      },
      {
        id: 'ai_cost_optimization',
        name: 'AI Cost Optimization',
        description: 'Smart caching and response optimization to reduce AI costs',
        enabled: true,
        rolloutPercentage: 50,
        environment: 'production',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        tags: ['ai', 'optimization', 'cost']
      },
      {
        id: 'enhanced_analytics',
        name: 'Enhanced Analytics',
        description: 'Advanced user behavior tracking and insights',
        enabled: true,
        rolloutPercentage: 100,
        environment: 'production',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        tags: ['analytics', 'tracking']
      }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.id, flag);
    });
  }

  /**
   * Evaluate feature flag for user
   */
  async isEnabled(
    flagId: string, 
    context: ExperimentContext,
    defaultValue: boolean = false
  ): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = `${flagId}:${context.userId}`;
      const cached = this.evaluationCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
        return cached.value;
      }

      // Evaluate flag
      const result = await experimentEngine.evaluateFeatureFlag(flagId, context, defaultValue);
      
      // Cache result
      this.evaluationCache.set(cacheKey, {
        value: result,
        timestamp: Date.now()
      });

      // Track flag evaluation
      experimentEngine.trackEvent({
        userId: context.userId,
        sessionId: context.sessionId,
        eventType: 'system',
        eventName: 'feature_flag_evaluation',
        timestamp: new Date().toISOString(),
        page: context.currentPage || 'unknown',
        properties: {
          flagId,
          enabled: result,
          defaultUsed: !this.flags.has(flagId)
        }
      });

      return result;
    } catch (error) {
      console.error(`[FeatureFlags] Error evaluating flag ${flagId}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get multiple flags at once
   */
  async getFlags(
    flagIds: string[],
    context: ExperimentContext
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      flagIds.map(async (flagId) => {
        results[flagId] = await this.isEnabled(flagId, context);
      })
    );

    return results;
  }

  /**
   * Get all flags for a user (for debugging/admin)
   */
  async getAllFlags(context: ExperimentContext): Promise<Record<string, boolean>> {
    const flagIds = Array.from(this.flags.keys());
    return this.getFlags(flagIds, context);
  }

  /**
   * Administrative methods
   */
  createFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): void {
    const fullFlag: FeatureFlag = {
      ...flag,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.flags.set(flag.id, fullFlag);
    this.clearCacheForFlag(flag.id);
  }

  updateFlag(flagId: string, updates: Partial<FeatureFlag>): boolean {
    const existingFlag = this.flags.get(flagId);
    if (!existingFlag) return false;

    const updatedFlag: FeatureFlag = {
      ...existingFlag,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.flags.set(flagId, updatedFlag);
    this.clearCacheForFlag(flagId);
    return true;
  }

  deleteFlag(flagId: string): boolean {
    const deleted = this.flags.delete(flagId);
    if (deleted) {
      this.clearCacheForFlag(flagId);
    }
    return deleted;
  }

  /**
   * Rollout management
   */
  gradualRollout(flagId: string, targetPercentage: number, dailyIncrease: number): void {
    const flag = this.flags.get(flagId);
    if (!flag) return;

    const interval = setInterval(() => {
      const currentFlag = this.flags.get(flagId);
      if (!currentFlag) {
        clearInterval(interval);
        return;
      }

      if (currentFlag.rolloutPercentage >= targetPercentage) {
        clearInterval(interval);
        return;
      }

      const newPercentage = Math.min(
        currentFlag.rolloutPercentage + dailyIncrease,
        targetPercentage
      );

      this.updateFlag(flagId, { rolloutPercentage: newPercentage });
    }, 24 * 60 * 60 * 1000); // Daily increase
  }

  /**
   * Emergency controls
   */
  emergencyDisable(flagId: string, reason: string): void {
    this.updateFlag(flagId, { 
      enabled: false,
      rolloutPercentage: 0
    });

    console.warn(`[FeatureFlags] Emergency disable of ${flagId}: ${reason}`);
  }

  emergencyEnable(flagId: string, percentage: number = 100): void {
    this.updateFlag(flagId, { 
      enabled: true,
      rolloutPercentage: percentage
    });

    console.info(`[FeatureFlags] Emergency enable of ${flagId} at ${percentage}%`);
  }

  /**
   * Analytics and monitoring
   */
  getFlagStats(): Record<string, {
    enabled: boolean;
    rolloutPercentage: number;
    evaluationCount: number;
    lastEvaluated: string;
  }> {
    const stats: Record<string, any> = {};

    this.flags.forEach((flag, id) => {
      stats[id] = {
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        evaluationCount: this.getCacheHits(id),
        lastEvaluated: flag.updatedAt
      };
    });

    return stats;
  }

  /**
   * Private utility methods
   */
  private clearCacheForFlag(flagId: string): void {
    for (const [key] of this.evaluationCache) {
      if (key.startsWith(`${flagId}:`)) {
        this.evaluationCache.delete(key);
      }
    }
  }

  private getCacheHits(flagId: string): number {
    let count = 0;
    for (const [key] of this.evaluationCache) {
      if (key.startsWith(`${flagId}:`)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Export/import for management
   */
  exportFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  importFlags(flags: FeatureFlag[]): void {
    flags.forEach(flag => {
      this.flags.set(flag.id, flag);
    });
    this.evaluationCache.clear();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.flags.clear();
    this.evaluationCache.clear();
  }
}

// Export singleton instance
export const featureFlagManager = new FeatureFlagManager();

// Convenience hooks for React components
export const useFeatureFlag = (flagId: string, context: ExperimentContext, defaultValue: boolean = false) => {
  const [isEnabled, setIsEnabled] = React.useState(defaultValue);
  
  React.useEffect(() => {
    featureFlagManager.isEnabled(flagId, context, defaultValue).then(setIsEnabled);
  }, [flagId, context.userId, defaultValue]);

  return isEnabled;
};

// Utility function for creating experiment context
export const createExperimentContext = (
  userId: string,
  sessionId: string,
  additionalContext: Partial<ExperimentContext> = {}
): ExperimentContext => {
  const baseContext: ExperimentContext = {
    userId,
    sessionId,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    utm: {},
    userType: 'returning', // Default, should be determined by app logic
    deviceType: 'desktop', // Default, should be determined by app logic
    ...additionalContext
  };

  return baseContext;
};

export default FeatureFlagManager;