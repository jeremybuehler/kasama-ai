/**
 * AI Controller
 * Main controller for handling AI agent requests and coordination
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AIOrchestrator } from '../orchestrator';
import { AgentType, AssessmentAnalysisInput, LearningPathInput } from '../types';

// Request validation schemas
const baseRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional()
});

const assessmentRequestSchema = baseRequestSchema.extend({
  agentType: z.literal('assessment_analyst'),
  input: z.object({
    answers: z.record(z.unknown()),
    assessmentType: z.string(),
    previousAssessments: z.array(z.unknown()).optional()
  })
});

const learningPathRequestSchema = baseRequestSchema.extend({
  agentType: z.literal('learning_coach'),
  input: z.object({
    userProfile: z.object({
      id: z.string(),
      subscriptionTier: z.enum(['free', 'premium', 'enterprise'])
    }),
    assessmentResults: z.array(z.unknown()),
    currentGoals: z.array(z.unknown()).optional(),
    learningPreferences: z.object({}).optional(),
    timeConstraints: z.object({}).optional()
  })
});

const insightRequestSchema = baseRequestSchema.extend({
  agentType: z.literal('insight_generator'),
  input: z.object({
    userProfile: z.object({
      id: z.string(),
      subscriptionTier: z.enum(['free', 'premium', 'enterprise'])
    }),
    recentActivities: z.array(z.unknown()).optional(),
    currentGoals: z.array(z.unknown()).optional(),
    preferences: z.object({}).optional()
  })
});

const progressRequestSchema = baseRequestSchema.extend({
  agentType: z.literal('progress_tracker'),
  input: z.object({
    userId: z.string(),
    timeframe: z.enum(['week', 'month', 'quarter']).default('week'),
    includeComparisons: z.boolean().default(true)
  })
});

const communicationRequestSchema = baseRequestSchema.extend({
  agentType: z.literal('communication_advisor'),
  input: z.object({
    scenario: z.string(),
    participants: z.array(z.string()).optional(),
    context: z.object({}).optional(),
    urgency: z.enum(['low', 'medium', 'high']).default('medium')
  })
});

export class AIController {
  private orchestrator: AIOrchestrator;

  constructor(orchestrator?: AIOrchestrator) {
    this.orchestrator = orchestrator || new AIOrchestrator({
      enableCaching: true,
      enableRateLimiting: true,
      enableMetrics: true,
      maxConcurrentRequests: 10,
      performanceLogging: process.env.NODE_ENV === 'development'
    });
  }

  /**
   * Process assessment analysis request
   */
  async analyzeAssessment(req: Request, res: Response) {
    try {
      const validated = assessmentRequestSchema.parse(req.body);
      
      const result = await this.orchestrator.analyzeAssessment(
        validated.input as AssessmentAnalysisInput,
        validated.userId,
        {
          priority: validated.priority,
          maxTokens: validated.maxTokens
        }
      );

      res.json({
        success: true,
        data: result,
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - req.startTime
        }
      });

    } catch (error) {
      console.error('Assessment analysis error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate learning path
   */
  async generateLearningPath(req: Request, res: Response) {
    try {
      const validated = learningPathRequestSchema.parse(req.body);
      
      const result = await this.orchestrator.generateLearningPath(
        validated.input as LearningPathInput,
        {
          skillLevel: 'beginner',
          focusAreas: []
        }
      );

      res.json({
        success: true,
        data: result,
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Generate daily insights
   */
  async generateInsights(req: Request, res: Response) {
    try {
      const validated = insightRequestSchema.parse(req.body);
      
      const result = await this.orchestrator.generateDailyInsights(
        validated.input,
        validated.userId
      );

      res.json({
        success: true,
        data: result,
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Track progress
   */
  async trackProgress(req: Request, res: Response) {
    try {
      const validated = progressRequestSchema.parse(req.body);
      
      const result = await this.orchestrator.trackProgress(
        validated.input.userId,
        validated.input.timeframe,
        { includeComparisons: validated.input.includeComparisons }
      );

      res.json({
        success: true,
        data: result,
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get communication advice
   */
  async getCommunicationAdvice(req: Request, res: Response) {
    try {
      const validated = communicationRequestSchema.parse(req.body);
      
      const result = await this.orchestrator.provideCommunicationGuidance(
        validated.input,
        validated.userId
      );

      res.json({
        success: true,
        data: result,
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get system metrics
   */
  async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await this.orchestrator.getSystemMetrics();
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const health = await this.orchestrator.getHealthStatus();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: health
      });

    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleError(error: any, res: Response) {
    console.error('AI Controller error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default AIController;
