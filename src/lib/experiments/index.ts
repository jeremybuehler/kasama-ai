/**
 * Experiment System Entry Point
 * Exports all experiment tracking functionality for Kasama AI
 */

// Core experiment engine
export { experimentEngine } from './core';
export type { ExperimentContext, ExperimentConfig, Experiment, ExperimentResults } from './types';

// Feature flags
export { featureFlagManager, useFeatureFlag, createExperimentContext } from './feature-flags';
export type { FeatureFlag, AudienceSegment } from './types';

// A/B testing for AI responses
export { aiTestingFramework } from './ai-testing';
export type { AITestConfig, AIVariant, AIResponse, SatisfactionSurvey } from './ai-testing';

// User engagement tracking
export { engagementTracker } from './engagement-tracking';
export type { 
  EngagementSession, 
  EngagementInteraction, 
  UserEngagementMetrics,
  EngagementKPIs 
} from './engagement-tracking';

// AI agent integration
export { 
  aiAgentFactory,
  useAIAgent,
  trackPageView,
  trackUserAction,
  startUserSession,
  endUserSession
} from './ai-integration';
export type { ExperimentEnabledAIAgent } from './ai-integration';

// Configuration and utilities
export { 
  configManager,
  statisticalUtils,
  ExperimentBuilder,
  defaultExperimentConfig,
  experimentTemplates,
  featureFlagTemplates
} from './config';

// React components
export { default as ExperimentDashboard } from '../components/experiments/ExperimentDashboard';

// Utility functions for easy integration
export const initializeExperiments = (userId: string) => {
  return startUserSession(userId);
};

export const cleanupExperiments = (sessionId: string) => {
  endUserSession(sessionId);
};

/**
 * Quick Start Guide:
 * 
 * 1. Initialize experiments when user logs in:
 *    ```ts
 *    import { initializeExperiments } from '@/lib/experiments';
 *    const sessionId = initializeExperiments(user.id);
 *    ```
 * 
 * 2. Use feature flags in components:
 *    ```ts
 *    import { useFeatureFlag, createExperimentContext } from '@/lib/experiments';
 *    const context = createExperimentContext(user.id, sessionId);
 *    const showNewFeature = useFeatureFlag('new_feature', context);
 *    ```
 * 
 * 3. Get AI responses with A/B testing:
 *    ```ts
 *    import { useAIAgent } from '@/lib/experiments';
 *    const { generateResponse, trackFeedback } = useAIAgent('assessment');
 *    const response = await generateResponse(input, user.id, sessionId, userProfile);
 *    ```
 * 
 * 4. Track user engagement:
 *    ```ts
 *    import { trackUserAction } from '@/lib/experiments';
 *    trackUserAction(user.id, sessionId, 'assessment_completed', 'assessment_flow');
 *    ```
 * 
 * 5. View experiment dashboard:
 *    ```tsx
 *    import { ExperimentDashboard } from '@/lib/experiments';
 *    <ExperimentDashboard />
 *    ```
 */

export default {
  // Core
  experimentEngine,
  featureFlagManager,
  aiTestingFramework,
  engagementTracker,
  aiAgentFactory,
  configManager,
  statisticalUtils,
  
  // Utilities
  initializeExperiments,
  cleanupExperiments,
  trackPageView,
  trackUserAction,
  useAIAgent,
  useFeatureFlag,
  createExperimentContext,
  
  // Components
  ExperimentDashboard
};