/**
 * Assessment Analyst Agent
 * 
 * Specializes in real-time relationship assessment scoring and analysis.
 * Provides comprehensive insights about relationship readiness, communication patterns,
 * attachment styles, and personalized growth opportunities.
 */

import { ProviderManager } from '../core/provider-manager';
import { SemanticCache } from '../core/semantic-cache';
import { ErrorHandler } from '../core/error-handler';
import { AGENT_CONFIGS } from '../constants';
import {
  AIRequest,
  AIResponse,
  AssessmentAnalysisInput,
  AssessmentAnalysisOutput,
  AssessmentInsight,
  ActionRecommendation,
  UserProfile,
  AssessmentData
} from '../types';

export interface AssessmentContext {
  userProfile: UserProfile;
  assessmentHistory: AssessmentData[];
  culturalContext?: string;
  relationshipGoals?: string[];
  currentChallenges?: string[];
}

export interface AssessmentScoring {
  overallScore: number;
  categoryScores: Record<string, number>;
  confidenceLevel: number;
  percentileRank: number;
  improvementPotential: number;
}

export class AssessmentAnalyst {
  private providerManager: ProviderManager;
  private cache: SemanticCache;
  private errorHandler: ErrorHandler;
  private config = AGENT_CONFIGS.assessment_analyst;

  constructor(
    providerManager: ProviderManager,
    cache: SemanticCache,
    errorHandler: ErrorHandler
  ) {
    this.providerManager = providerManager;
    this.cache = cache;
    this.errorHandler = errorHandler;
  }

  /**
   * Analyze assessment responses and provide comprehensive scoring and insights
   */
  async analyzeAssessment(
    input: AssessmentAnalysisInput,
    context?: AssessmentContext
  ): Promise<AssessmentAnalysisOutput> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: context?.userProfile?.id || 'anonymous',
      agentType: 'assessment_analyst',
      inputData: {
        answers: input.answers,
        assessmentType: input.assessmentType,
        previousAssessments: input.previousAssessments,
        context
      },
      priority: 'high',
      maxTokens: this.config.maxTokens,
      context: {
        userProfile: context?.userProfile,
        assessmentData: {
          id: requestId,
          type: input.assessmentType,
          answers: input.answers,
          category: 'relationship_readiness',
          difficultyLevel: 'intermediate'
        }
      }
    };

    try {
      // Check cache first
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseAnalysisResponse(cachedResponse);
      }

      // Generate the analysis prompt
      const prompt = this.buildAnalysisPrompt(input, context);
      
      // Process with AI provider
      const providerRequest = {
        ...request,
        inputData: { prompt, ...request.inputData }
      };

      const response = await this.providerManager.processRequest(providerRequest);
      
      // Cache the response
      await this.cache.set(request, response);
      
      return this.parseAnalysisResponse(response);
      
    } catch (error) {
      const aiError = this.errorHandler.handleError(error, {
        agentType: 'assessment_analyst',
        userId: request.userId,
        requestId
      });
      
      // Return fallback analysis on error
      return this.generateFallbackAnalysis(input, context);
    }
  }

  /**
   * Generate quick assessment score without full analysis
   */
  async quickScore(
    answers: Record<string, unknown>,
    assessmentType: string
  ): Promise<AssessmentScoring> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: 'anonymous',
      agentType: 'assessment_analyst',
      inputData: { answers, assessmentType, quickScore: true },
      priority: 'medium',
      maxTokens: 1000
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseScoreResponse(cachedResponse);
      }

      const prompt = this.buildScoringPrompt(answers, assessmentType);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseScoreResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, { agentType: 'assessment_analyst' });
      return this.generateFallbackScore(answers);
    }
  }

  /**
   * Compare assessment with previous results to show progress
   */
  async compareAssessments(
    currentAssessment: AssessmentData,
    previousAssessments: AssessmentData[],
    context?: AssessmentContext
  ): Promise<{
    progressInsights: AssessmentInsight[];
    trendAnalysis: {
      direction: 'improving' | 'declining' | 'stable';
      rate: number;
      keyChanges: string[];
    };
    recommendations: ActionRecommendation[];
  }> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: context?.userProfile?.id || 'anonymous',
      agentType: 'assessment_analyst',
      inputData: {
        currentAssessment,
        previousAssessments,
        context,
        comparison: true
      },
      priority: 'medium',
      maxTokens: this.config.maxTokens
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseComparisonResponse(cachedResponse);
      }

      const prompt = this.buildComparisonPrompt(currentAssessment, previousAssessments, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseComparisonResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, { agentType: 'assessment_analyst' });
      return this.generateFallbackComparison(currentAssessment, previousAssessments);
    }
  }

  private buildAnalysisPrompt(input: AssessmentAnalysisInput, context?: AssessmentContext): string {
    const contextInfo = context ? `
User Context:
- Profile: ${JSON.stringify(context.userProfile, null, 2)}
- Goals: ${context.relationshipGoals?.join(', ') || 'Not specified'}
- Challenges: ${context.currentChallenges?.join(', ') || 'None specified'}` : '';
    
    return `You are an expert relationship assessment analyst. Analyze the following assessment responses and provide comprehensive insights.

Assessment Type: ${input.assessmentType}

User Responses:
${JSON.stringify(input.answers, null, 2)}

Previous Assessments (for context):
${input.previousAssessments ? JSON.stringify(input.previousAssessments.slice(-3), null, 2) : 'None'}${contextInfo}

Provide a comprehensive analysis in the following JSON format:
{
  "score": <overall score 0-100>,
  "insights": [
    {
      "type": "pattern|strength|opportunity|warning",
      "title": "<insight title>",
      "description": "<detailed description>",
      "priority": "low|medium|high",
      "category": "<category>",
      "evidence": ["<supporting evidence>"]
    }
  ],
  "recommendations": [
    {
      "id": "<unique id>",
      "title": "<recommendation title>",
      "description": "<detailed description>",
      "category": "<category>",
      "priority": "low|medium|high",
      "estimatedTime": <minutes>,
      "difficulty": "beginner|intermediate|advanced",
      "actionItems": ["<specific action>"],
      "resources": [{
        "title": "<resource title>",
        "url": "<url>",
        "type": "article|video|exercise|tool",
        "description": "<description>"
      }]
    }
  ],
  "strengths": ["<strength>"],
  "growthAreas": ["<growth area>"],
  "confidenceLevel": <0-1 confidence in analysis>
}

Focus on:
1. Identifying relationship patterns and attachment styles
2. Highlighting communication strengths and challenges
3. Providing actionable, specific recommendations
4. Being supportive and encouraging while honest about areas for growth
5. Considering cultural context and individual circumstances

Be empathetic, non-judgmental, and focus on growth opportunities.`;
  }

  private buildScoringPrompt(answers: Record<string, unknown>, assessmentType: string): string {
    return `Analyze these assessment responses and provide a quick scoring breakdown.

Assessment Type: ${assessmentType}
Responses: ${JSON.stringify(answers, null, 2)}

Provide scoring in this JSON format:
{
  "overallScore": <0-100>,
  "categoryScores": {
    "communication": <0-100>,
    "emotional_intelligence": <0-100>,
    "attachment_security": <0-100>,
    "conflict_resolution": <0-100>,
    "self_awareness": <0-100>
  },
  "confidenceLevel": <0-1>,
  "percentileRank": <0-100>,
  "improvementPotential": <0-100>
}

Base scoring on evidence-based relationship research and provide accurate, helpful scores.`;
  }

  private buildComparisonPrompt(
    current: AssessmentData, 
    previous: AssessmentData[], 
    context?: AssessmentContext
  ): string {
    return `Compare these assessment results to identify progress and trends.

Current Assessment:
${JSON.stringify(current, null, 2)}

Previous Assessments (chronological):
${JSON.stringify(previous.slice(-5), null, 2)}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide comparison analysis in this JSON format:
{
  "progressInsights": [
    {
      "type": "pattern|strength|opportunity|warning",
      "title": "<insight title>",
      "description": "<description>",
      "priority": "low|medium|high",
      "category": "<category>",
      "evidence": ["<evidence>"]
    }
  ],
  "trendAnalysis": {
    "direction": "improving|declining|stable",
    "rate": <rate of change percentage>,
    "keyChanges": ["<key change>"]
  },
  "recommendations": [
    {
      "id": "<unique id>",
      "title": "<title>",
      "description": "<description>",
      "category": "<category>",
      "priority": "low|medium|high",
      "estimatedTime": <minutes>,
      "difficulty": "beginner|intermediate|advanced",
      "actionItems": ["<action>"]
    }
  ]
}

Focus on celebrating progress, identifying patterns, and providing encouraging guidance for continued growth.`;
  }

  private parseAnalysisResponse(response: AIResponse): AssessmentAnalysisOutput {
    try {
      if (typeof response.output === 'string') {
        const parsed = JSON.parse(response.output);
        return this.validateAnalysisOutput(parsed);
      } else if (typeof response.output === 'object') {
        return this.validateAnalysisOutput(response.output);
      }
    } catch (error) {
      console.error('Failed to parse assessment analysis response:', error);
    }
    
    // Return structured fallback
    return {
      score: 75,
      insights: [{
        type: 'pattern',
        title: 'Analysis in Progress',
        description: 'We\'re processing your assessment results to provide personalized insights.',
        priority: 'medium',
        category: 'general',
        evidence: ['Assessment completed successfully']
      }],
      recommendations: [{
        id: 'general-1',
        title: 'Continue Your Growth Journey',
        description: 'Regular self-reflection and practice are key to relationship development.',
        category: 'general',
        priority: 'medium',
        estimatedTime: 10,
        difficulty: 'beginner',
        actionItems: ['Take time for daily reflection', 'Practice active listening']
      }],
      strengths: ['Commitment to growth', 'Self-awareness'],
      growthAreas: ['Continued practice', 'Skill development'],
      confidenceLevel: 0.7
    };
  }

  private parseScoreResponse(response: AIResponse): AssessmentScoring {
    try {
      if (typeof response.output === 'string') {
        const parsed = JSON.parse(response.output);
        return this.validateScoreOutput(parsed);
      } else if (typeof response.output === 'object') {
        return this.validateScoreOutput(response.output);
      }
    } catch (error) {
      console.error('Failed to parse scoring response:', error);
    }
    
    return {
      overallScore: 75,
      categoryScores: {
        communication: 70,
        emotional_intelligence: 75,
        attachment_security: 80,
        conflict_resolution: 70,
        self_awareness: 85
      },
      confidenceLevel: 0.7,
      percentileRank: 60,
      improvementPotential: 85
    };
  }

  private parseComparisonResponse(response: AIResponse): {
    progressInsights: AssessmentInsight[];
    trendAnalysis: {
      direction: 'improving' | 'declining' | 'stable';
      rate: number;
      keyChanges: string[];
    };
    recommendations: ActionRecommendation[];
  } {
    try {
      if (typeof response.output === 'string') {
        return JSON.parse(response.output);
      } else if (typeof response.output === 'object') {
        return response.output as any;
      }
    } catch (error) {
      console.error('Failed to parse comparison response:', error);
    }
    
    return {
      progressInsights: [{
        type: 'pattern',
        title: 'Continuous Growth',
        description: 'You\'re showing consistent engagement with your relationship development.',
        priority: 'medium',
        category: 'progress',
        evidence: ['Regular assessment completion']
      }],
      trendAnalysis: {
        direction: 'improving',
        rate: 15,
        keyChanges: ['Increased self-awareness', 'Better communication skills']
      },
      recommendations: [{
        id: 'progress-1',
        title: 'Maintain Momentum',
        description: 'Continue your current practices to build on your progress.',
        category: 'maintenance',
        priority: 'medium',
        estimatedTime: 15,
        difficulty: 'beginner',
        actionItems: ['Daily check-ins with yourself', 'Practice new skills in real situations']
      }]
    };
  }

  private validateAnalysisOutput(output: any): AssessmentAnalysisOutput {
    return {
      score: Math.max(0, Math.min(100, output.score || 75)),
      insights: Array.isArray(output.insights) ? output.insights : [],
      recommendations: Array.isArray(output.recommendations) ? output.recommendations : [],
      strengths: Array.isArray(output.strengths) ? output.strengths : ['Self-awareness'],
      growthAreas: Array.isArray(output.growthAreas) ? output.growthAreas : ['Continued growth'],
      confidenceLevel: Math.max(0, Math.min(1, output.confidenceLevel || 0.7))
    };
  }

  private validateScoreOutput(output: any): AssessmentScoring {
    return {
      overallScore: Math.max(0, Math.min(100, output.overallScore || 75)),
      categoryScores: output.categoryScores || {},
      confidenceLevel: Math.max(0, Math.min(1, output.confidenceLevel || 0.7)),
      percentileRank: Math.max(0, Math.min(100, output.percentileRank || 50)),
      improvementPotential: Math.max(0, Math.min(100, output.improvementPotential || 80))
    };
  }

  private generateFallbackAnalysis(
    input: AssessmentAnalysisInput, 
    context?: AssessmentContext
  ): AssessmentAnalysisOutput {
    // Generate a basic analysis when AI fails
    const basicScore = this.calculateBasicScore(input.answers);
    
    return {
      score: basicScore,
      insights: [
        {
          type: 'strength',
          title: 'Commitment to Growth',
          description: 'Taking this assessment shows your commitment to personal and relationship development.',
          priority: 'medium',
          category: 'self_awareness',
          evidence: ['Completed comprehensive assessment']
        },
        {
          type: 'opportunity',
          title: 'Continued Learning',
          description: 'Every assessment is an opportunity to learn more about yourself and grow.',
          priority: 'medium',
          category: 'general',
          evidence: ['Active participation in self-assessment']
        }
      ],
      recommendations: [
        {
          id: 'fallback-1',
          title: 'Daily Reflection Practice',
          description: 'Spend 5-10 minutes each day reflecting on your interactions and feelings.',
          category: 'self_awareness',
          priority: 'high',
          estimatedTime: 10,
          difficulty: 'beginner',
          actionItems: [
            'Set aside 10 minutes each evening for reflection',
            'Ask yourself: "What went well today in my relationships?"',
            'Identify one thing you could improve tomorrow'
          ]
        }
      ],
      strengths: ['Self-awareness', 'Motivation to improve'],
      growthAreas: ['Skill development', 'Consistent practice'],
      confidenceLevel: 0.6
    };
  }

  private generateFallbackScore(answers: Record<string, unknown>): AssessmentScoring {
    const basicScore = this.calculateBasicScore(answers);
    
    return {
      overallScore: basicScore,
      categoryScores: {
        communication: basicScore + Math.random() * 10 - 5,
        emotional_intelligence: basicScore + Math.random() * 10 - 5,
        attachment_security: basicScore + Math.random() * 10 - 5,
        conflict_resolution: basicScore + Math.random() * 10 - 5,
        self_awareness: basicScore + Math.random() * 10 - 5
      },
      confidenceLevel: 0.6,
      percentileRank: Math.max(25, Math.min(75, basicScore + Math.random() * 20 - 10)),
      improvementPotential: Math.max(70, 100 - basicScore + Math.random() * 10)
    };
  }

  private generateFallbackComparison(
    current: AssessmentData, 
    previous: AssessmentData[]
  ): {
    progressInsights: AssessmentInsight[];
    trendAnalysis: { direction: 'improving' | 'declining' | 'stable'; rate: number; keyChanges: string[] };
    recommendations: ActionRecommendation[];
  } {
    return {
      progressInsights: [{
        type: 'pattern',
        title: 'Consistent Engagement',
        description: 'You\'re consistently engaging with your personal development, which is a positive indicator.',
        priority: 'medium',
        category: 'progress',
        evidence: ['Multiple assessment completions']
      }],
      trendAnalysis: {
        direction: 'stable',
        rate: 5,
        keyChanges: ['Maintained engagement', 'Continued self-reflection']
      },
      recommendations: [{
        id: 'comparison-fallback-1',
        title: 'Build on Consistency',
        description: 'Your consistent approach to self-assessment is commendable. Focus on applying insights.',
        category: 'application',
        priority: 'medium',
        estimatedTime: 20,
        difficulty: 'intermediate',
        actionItems: ['Apply one insight from your assessment each week', 'Track your progress in a journal']
      }]
    };
  }

  private calculateBasicScore(answers: Record<string, unknown>): number {
    // Simple heuristic scoring when AI is unavailable
    let score = 50; // Base score
    const answerCount = Object.keys(answers).length;
    
    // Completion bonus
    if (answerCount > 10) score += 15;
    if (answerCount > 20) score += 10;
    
    // Analyze answer patterns (very basic)
    const answerValues = Object.values(answers);
    const positiveAnswers = answerValues.filter(value => 
      typeof value === 'string' && 
      (['yes', 'often', 'usually', 'agree', 'strongly agree'].some(pos => 
        value.toLowerCase().includes(pos)
      ))
    ).length;
    
    // Add score based on positive responses
    score += (positiveAnswers / answerCount) * 30;
    
    return Math.max(30, Math.min(95, score));
  }

  /**
   * Validate assessment answers for completeness and quality
   */
  validateAssessmentInput(input: AssessmentAnalysisInput): {
    valid: boolean;
    issues: string[];
    completeness: number;
  } {
    const issues: string[] = [];
    let completeness = 0;
    
    if (!input.answers || typeof input.answers !== 'object') {
      issues.push('No assessment answers provided');
      return { valid: false, issues, completeness: 0 };
    }
    
    const answerCount = Object.keys(input.answers).length;
    if (answerCount < 5) {
      issues.push('Assessment appears incomplete (less than 5 questions answered)');
    }
    
    // Check for empty or invalid answers
    let validAnswers = 0;
    for (const [key, value] of Object.entries(input.answers)) {
      if (value !== null && value !== undefined && value !== '') {
        validAnswers++;
      } else {
        issues.push(`Question '${key}' has no answer`);
      }
    }
    
    completeness = validAnswers / answerCount;
    
    if (completeness < 0.8) {
      issues.push('Assessment is less than 80% complete');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      completeness
    };
  }

  /**
   * Get assessment analytics for monitoring
   */
  getAnalytics(): {
    totalAnalyses: number;
    averageScore: number;
    commonInsightTypes: Record<string, number>;
    recommendationCategories: Record<string, number>;
  } {
    // This would typically query a database or analytics service
    // For now, return mock data
    return {
      totalAnalyses: 0,
      averageScore: 0,
      commonInsightTypes: {},
      recommendationCategories: {}
    };
  }
}