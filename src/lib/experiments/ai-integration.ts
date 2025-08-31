/**
 * AI Agent Integration Layer
 * Integrates experiment system with existing AI agents
 */

import { experimentEngine } from './core';
import { aiTestingFramework } from './ai-testing';
import { featureFlagManager, createExperimentContext } from './feature-flags';
import { engagementTracker } from './engagement-tracking';
import { ExperimentContext } from './types';

// Enhanced AI Agent Interface with Experiment Integration
export interface ExperimentEnabledAIAgent {
  id: string;
  type: 'assessment' | 'learning' | 'progress' | 'insight' | 'communication';
  version: string;
  
  // Core AI methods with experiment integration
  generateResponse(
    input: any, 
    context: ExperimentContext,
    userProfile?: any
  ): Promise<{
    content: string;
    metadata: {
      experimentId?: string;
      variantId?: string;
      provider: string;
      responseTime: number;
      tokenCount: number;
      cost: number;
    };
  }>;
  
  // Experiment-specific methods
  trackInteraction(
    userId: string,
    sessionId: string,
    interaction: {
      type: 'question' | 'response' | 'feedback' | 'rating';
      data: any;
      satisfaction?: number;
    }
  ): void;
}

/**
 * Enhanced Assessment Agent with A/B Testing
 */
export class ExperimentEnabledAssessmentAgent implements ExperimentEnabledAIAgent {
  id = 'assessment_agent';
  type = 'assessment' as const;
  version = '2.0.0';

  async generateResponse(
    input: {
      question: string;
      answer: string;
      questionType: 'multiple_choice' | 'scale' | 'text';
      assessmentContext: any;
    },
    context: ExperimentContext,
    userProfile?: any
  ) {
    // Check feature flags first
    const useEnhancedAgent = await featureFlagManager.isEnabled(
      'ai_agent_v2',
      context,
      false
    );

    // Get AI response through A/B testing framework
    const aiResponse = await aiTestingFramework.getAIResponse(
      'assessment',
      context,
      {
        question: input.question,
        answer: input.answer,
        userContext: JSON.stringify(userProfile || {})
      },
      userProfile
    );

    // Track engagement
    engagementTracker.trackAIInteraction(context.sessionId, {
      agentType: 'assessment',
      interactionType: 'response',
      duration: aiResponse.metadata.responseTime,
      experimentId: aiResponse.metadata.experimentId,
      variantId: aiResponse.metadata.variantId
    });

    return {
      content: aiResponse.content,
      metadata: aiResponse.metadata
    };
  }

  trackInteraction(
    userId: string,
    sessionId: string,
    interaction: {
      type: 'question' | 'response' | 'feedback' | 'rating';
      data: any;
      satisfaction?: number;
    }
  ) {
    engagementTracker.trackAIInteraction(sessionId, {
      agentType: 'assessment',
      interactionType: interaction.type,
      duration: 0,
      satisfactionRating: interaction.satisfaction
    });

    // Track specific assessment metrics
    if (interaction.type === 'response') {
      engagementTracker.trackTaskCompletion(sessionId, {
        taskType: 'assessment',
        taskId: crypto.randomUUID(),
        completionTime: new Date().toISOString(),
        timeSpent: interaction.data.timeSpent || 0,
        completionRate: 100,
        helpRequested: false
      });
    }
  }
}

/**
 * Enhanced Learning Coach with Experiment Support
 */
export class ExperimentEnabledLearningCoach implements ExperimentEnabledAIAgent {
  id = 'learning_coach';
  type = 'learning' as const;
  version = '2.0.0';

  async generateResponse(
    input: {
      topic: string;
      userLevel: 'beginner' | 'intermediate' | 'advanced';
      learningGoals: string[];
      context: any;
    },
    context: ExperimentContext,
    userProfile?: any
  ) {
    // Check for personalized learning feature
    const usePersonalizedLearning = await featureFlagManager.isEnabled(
      'personalized_learning',
      context,
      false
    );

    const aiResponse = await aiTestingFramework.getAIResponse(
      'learning',
      context,
      {
        topic: input.topic,
        userLevel: input.userLevel,
        learningGoals: input.learningGoals.join(', '),
        userContext: JSON.stringify(userProfile || {})
      },
      userProfile
    );

    // Track learning engagement
    engagementTracker.trackEngagement(
      context.userId,
      context.sessionId,
      {
        action: 'learning_content_generated',
        feature: 'learning_coach',
        value: 1,
        success: true,
        metadata: {
          topic: input.topic,
          userLevel: input.userLevel,
          personalized: usePersonalizedLearning
        }
      }
    );

    return {
      content: aiResponse.content,
      metadata: aiResponse.metadata
    };
  }

  trackInteraction(
    userId: string,
    sessionId: string,
    interaction: {
      type: 'question' | 'response' | 'feedback' | 'rating';
      data: any;
      satisfaction?: number;
    }
  ) {
    engagementTracker.trackAIInteraction(sessionId, {
      agentType: 'learning',
      interactionType: interaction.type,
      duration: interaction.data.duration || 0,
      satisfactionRating: interaction.satisfaction
    });
  }
}

/**
 * Enhanced Daily Insights Generator
 */
export class ExperimentEnabledInsightGenerator implements ExperimentEnabledAIAgent {
  id = 'insight_generator';
  type = 'insight' as const;
  version = '2.0.0';

  async generateResponse(
    input: {
      userProgress: any;
      relationshipStage: string;
      recentActivities: any[];
    },
    context: ExperimentContext,
    userProfile?: any
  ) {
    const aiResponse = await aiTestingFramework.getAIResponse(
      'insight',
      context,
      {
        recentProgress: JSON.stringify(input.userProgress),
        relationshipStage: input.relationshipStage,
        userContext: JSON.stringify(userProfile || {})
      },
      userProfile
    );

    // Track insight engagement
    engagementTracker.trackEngagement(
      context.userId,
      context.sessionId,
      {
        action: 'daily_insight_generated',
        feature: 'insight_generator',
        value: 1,
        success: true
      }
    );

    return {
      content: aiResponse.content,
      metadata: aiResponse.metadata
    };
  }

  trackInteraction(
    userId: string,
    sessionId: string,
    interaction: {
      type: 'question' | 'response' | 'feedback' | 'rating';
      data: any;
      satisfaction?: number;
    }
  ) {
    engagementTracker.trackAIInteraction(sessionId, {
      agentType: 'insight',
      interactionType: interaction.type,
      duration: 0,
      satisfactionRating: interaction.satisfaction
    });

    // Track insight engagement
    if (interaction.type === 'feedback' && interaction.satisfaction) {
      engagementTracker.trackEngagement(
        interaction.data.userId,
        sessionId,
        {
          action: 'insight_rated',
          feature: 'daily_insights',
          value: interaction.satisfaction,
          success: interaction.satisfaction >= 3
        }
      );
    }
  }
}

/**
 * AI Agent Factory with Experiment Integration
 */
export class AIAgentFactory {
  private agents: Map<string, ExperimentEnabledAIAgent> = new Map();

  constructor() {
    this.registerDefaultAgents();
  }

  private registerDefaultAgents() {
    this.agents.set('assessment', new ExperimentEnabledAssessmentAgent());
    this.agents.set('learning', new ExperimentEnabledLearningCoach());
    this.agents.set('insight', new ExperimentEnabledInsightGenerator());
  }

  getAgent(type: string): ExperimentEnabledAIAgent | null {
    return this.agents.get(type) || null;
  }

  async getAIResponse(
    agentType: string,
    input: any,
    userId: string,
    sessionId: string,
    userProfile?: any
  ): Promise<{
    content: string;
    metadata: any;
    experimentContext?: {
      experimentId?: string;
      variantId?: string;
    };
  } | null> {
    const agent = this.getAgent(agentType);
    if (!agent) return null;

    const context = createExperimentContext(userId, sessionId, {
      currentPage: `/${agentType}`,
      userType: userProfile?.type || 'returning',
      deviceType: this.detectDeviceType()
    });

    try {
      const response = await agent.generateResponse(input, context, userProfile);
      
      return {
        content: response.content,
        metadata: response.metadata,
        experimentContext: {
          experimentId: response.metadata.experimentId,
          variantId: response.metadata.variantId
        }
      };
    } catch (error) {
      console.error(`[AIAgentFactory] Error generating response for ${agentType}:`, error);
      return null;
    }
  }

  trackUserFeedback(
    agentType: string,
    userId: string,
    sessionId: string,
    responseId: string,
    satisfaction: number,
    feedback?: string
  ) {
    const agent = this.getAgent(agentType);
    if (!agent) return;

    // Track satisfaction with AI testing framework
    aiTestingFramework.trackSatisfaction(responseId, userId, {
      rating: satisfaction,
      feedback,
      categories: {
        helpfulness: satisfaction,
        accuracy: satisfaction,
        relevance: satisfaction,
        clarity: satisfaction
      }
    });

    // Track interaction with agent
    agent.trackInteraction(userId, sessionId, {
      type: 'rating',
      data: { responseId, feedback },
      satisfaction
    });
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}

/**
 * React Hook for AI Agent Integration
 */
export const useAIAgent = (agentType: string) => {
  const factory = React.useMemo(() => new AIAgentFactory(), []);

  const generateResponse = React.useCallback(
    async (input: any, userId: string, sessionId: string, userProfile?: any) => {
      return factory.getAIResponse(agentType, input, userId, sessionId, userProfile);
    },
    [factory, agentType]
  );

  const trackFeedback = React.useCallback(
    (userId: string, sessionId: string, responseId: string, satisfaction: number, feedback?: string) => {
      factory.trackUserFeedback(agentType, userId, sessionId, responseId, satisfaction, feedback);
    },
    [factory, agentType]
  );

  return {
    generateResponse,
    trackFeedback
  };
};

/**
 * Utility Functions
 */
export const trackPageView = (userId: string, sessionId: string, page: string) => {
  engagementTracker.trackPageView(sessionId, page);
};

export const trackUserAction = (
  userId: string,
  sessionId: string,
  action: string,
  feature: string,
  metadata?: any
) => {
  engagementTracker.trackEngagement(userId, sessionId, {
    action,
    feature,
    success: true,
    metadata
  });
};

export const startUserSession = (userId: string): string => {
  const context = createExperimentContext(userId, crypto.randomUUID(), {
    currentPage: window.location.pathname
  });
  
  return engagementTracker.startSession(userId, context);
};

export const endUserSession = (sessionId: string) => {
  engagementTracker.endSession(sessionId);
};

// Export singleton factory
export const aiAgentFactory = new AIAgentFactory();

export default AIAgentFactory;