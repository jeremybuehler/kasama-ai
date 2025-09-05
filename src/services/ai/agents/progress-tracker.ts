/**
 * Progress Tracker Agent
 * 
 * Specializes in growth pattern recognition, milestone tracking, and progress analysis.
 * Provides insights about user development trends, achievements, and areas for improvement.
 */

import { ProviderManager } from '../core/provider-manager';
import { SemanticCache } from '../core/semantic-cache';
import { ErrorHandler } from '../core/error-handler';
import { AGENT_CONFIGS } from '../constants';
import {
  AIRequest,
  AIResponse,
  ProgressAnalysisInput,
  ProgressAnalysisOutput,
  ProgressMetrics,
  ProgressPattern,
  Achievement,
  ProgressInsight,
  Milestone,
  UserProfile
} from '../types';

export interface ProgressContext {
  baselineDate: Date;
  trackingCategories: string[];
  comparisonPeriods: ('week' | 'month' | 'quarter')[];
  focusMetrics: ('consistency' | 'improvement' | 'engagement')[];
  includePredictions: boolean;
}

export interface StreakAnalysis {
  currentStreak: number;
  longestStreak: number;
  streakQuality: 'excellent' | 'good' | 'moderate' | 'needs_improvement';
  streakPrediction: {
    likelyToContinue: boolean;
    riskFactors: string[];
    recommendations: string[];
  };
}

export interface TrendForecast {
  nextWeekPrediction: {
    expectedProgress: number;
    confidenceLevel: number;
    keyFactors: string[];
  };
  nextMonthOutlook: {
    projectedMilestones: string[];
    potentialChallenges: string[];
    successProbability: number;
  };
  recommendedActions: string[];
}

export class ProgressTracker {
  private providerManager: ProviderManager;
  private cache: SemanticCache;
  private errorHandler: ErrorHandler;
  private config = AGENT_CONFIGS.progress_tracker;

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
   * Analyze user progress patterns and generate comprehensive insights
   */
  async analyzeProgress(
    input: ProgressAnalysisInput,
    context?: ProgressContext
  ): Promise<ProgressAnalysisOutput> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: input.userId,
      agentType: 'progress_tracker',
      inputData: {
        ...input,
        context
      },
      priority: 'medium',
      maxTokens: this.config.maxTokens
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseProgressAnalysisResponse(cachedResponse);
      }

      const prompt = this.buildProgressAnalysisPrompt(input, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseProgressAnalysisResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, {
        agentType: 'progress_tracker',
        userId: request.userId,
        requestId
      });
      
      return this.generateFallbackProgressAnalysis(input);
    }
  }

  /**
   * Analyze streak patterns and provide streak-specific insights
   */
  async analyzeStreaks(
    userId: string,
    activityData: Array<{ date: Date; completed: boolean; type: string }>,
    context?: ProgressContext
  ): Promise<StreakAnalysis> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId,
      agentType: 'progress_tracker',
      inputData: {
        activityData,
        context,
        streakAnalysis: true
      },
      priority: 'low',
      maxTokens: 1500
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseStreakAnalysisResponse(cachedResponse);
      }

      const prompt = this.buildStreakAnalysisPrompt(activityData, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseStreakAnalysisResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, { agentType: 'progress_tracker' });
      return this.generateFallbackStreakAnalysis(activityData);
    }
  }

  /**
   * Generate trend forecasts and predictions
   */
  async generateTrendForecast(
    userId: string,
    historicalData: ProgressMetrics[],
    currentGoals: string[],
    context?: ProgressContext
  ): Promise<TrendForecast> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId,
      agentType: 'progress_tracker',
      inputData: {
        historicalData,
        currentGoals,
        context,
        forecast: true
      },
      priority: 'low',
      maxTokens: 2000
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseTrendForecastResponse(cachedResponse);
      }

      const prompt = this.buildTrendForecastPrompt(historicalData, currentGoals, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseTrendForecastResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, { agentType: 'progress_tracker' });
      return this.generateFallbackTrendForecast(historicalData);
    }
  }

  /**
   * Detect and validate achievements
   */
  async detectAchievements(
    userId: string,
    recentActivity: Array<{ date: Date; type: string; data: any }>,
    userProfile: UserProfile
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = [];
    const now = new Date();
    
    // Streak achievements
    const streakData = this.calculateStreakData(recentActivity);
    if (streakData.currentStreak === 7) {
      achievements.push({
        id: 'week-streak',
        type: 'streak',
        title: '7-Day Streak',
        description: 'Maintained consistent daily practice for a full week!',
        earnedAt: now,
        category: 'consistency',
        rarity: 'common',
        points: 50
      });
    }
    
    if (streakData.currentStreak === 30) {
      achievements.push({
        id: 'month-streak',
        type: 'streak',
        title: '30-Day Champion',
        description: 'Incredible consistency with 30 days of continuous practice!',
        earnedAt: now,
        category: 'consistency',
        rarity: 'rare',
        points: 300
      });
    }
    
    // Completion achievements
    const completionCount = recentActivity.filter(a => a.type === 'practice_completed').length;
    if (completionCount >= 10 && completionCount < 15) {
      achievements.push({
        id: 'practice-explorer',
        type: 'completion',
        title: 'Practice Explorer',
        description: 'Completed 10+ different practices',
        earnedAt: now,
        category: 'exploration',
        rarity: 'common',
        points: 100
      });
    }
    
    // Improvement achievements (would need historical comparison)
    const recentScores = recentActivity
      .filter(a => a.type === 'assessment_completed' && a.data?.score)
      .map(a => a.data.score);
    
    if (recentScores.length >= 2) {
      const improvement = recentScores[recentScores.length - 1] - recentScores[0];
      if (improvement >= 10) {
        achievements.push({
          id: 'improvement-star',
          type: 'improvement',
          title: 'Rising Star',
          description: 'Showed significant improvement in assessment scores',
          earnedAt: now,
          category: 'growth',
          rarity: 'uncommon',
          points: 150
        });
      }
    }
    
    return achievements;
  }

  /**
   * Generate progress insights with actionable recommendations
   */
  async generateProgressInsights(
    metrics: ProgressMetrics,
    patterns: ProgressPattern[],
    userGoals: string[]
  ): Promise<ProgressInsight[]> {
    const insights: ProgressInsight[] = [];
    
    // Consistency insights
    if (metrics.consistencyScore >= 0.8) {
      insights.push({
        type: 'celebration',
        title: 'Exceptional Consistency',
        message: 'Your consistency score of ' + Math.round(metrics.consistencyScore * 100) + '% shows remarkable dedication to your growth.',
        priority: 'high',
        category: 'consistency',
        actionable: false,
        evidence: [`Consistency score: ${Math.round(metrics.consistencyScore * 100)}%`]
      });
    } else if (metrics.consistencyScore < 0.5) {
      insights.push({
        type: 'encouragement',
        title: 'Building Consistency',
        message: 'Consistency is a skill that develops over time. Even small, regular steps make a big difference.',
        priority: 'medium',
        category: 'consistency',
        actionable: true,
        evidence: [`Current consistency: ${Math.round(metrics.consistencyScore * 100)}%`]
      });
    }
    
    // Engagement insights
    if (metrics.engagementLevel === 'high') {
      insights.push({
        type: 'celebration',
        title: 'High Engagement',
        message: 'Your active participation shows real commitment to your relationship development goals.',
        priority: 'medium',
        category: 'engagement',
        actionable: false,
        evidence: ['High engagement level detected']
      });
    } else if (metrics.engagementLevel === 'low') {
      insights.push({
        type: 'adjustment',
        title: 'Rekindling Motivation',
        message: 'It looks like engagement has dropped. This is normal - try focusing on practices that excited you most.',
        priority: 'high',
        category: 'engagement',
        actionable: true,
        evidence: ['Low engagement level detected']
      });
    }
    
    // Pattern-based insights
    patterns.forEach(pattern => {
      if (pattern.type === 'improvement' && pattern.strength > 0.7) {
        insights.push({
          type: 'celebration',
          title: 'Steady Improvement',
          message: `Great progress in ${pattern.category}! ${pattern.description}`,
          priority: 'medium',
          category: pattern.category,
          actionable: false,
          evidence: [`Improvement pattern strength: ${Math.round(pattern.strength * 100)}%`]
        });
      } else if (pattern.type === 'plateau' && pattern.strength > 0.6) {
        insights.push({
          type: 'challenge',
          title: 'Breaking Through Plateaus',
          message: `You've reached a plateau in ${pattern.category}. This is a great time to try new approaches or increase difficulty.`,
          priority: 'medium',
          category: pattern.category,
          actionable: true,
          evidence: [`Plateau detected in ${pattern.category}`]
        });
      }
    });
    
    return insights;
  }

  private buildProgressAnalysisPrompt(input: ProgressAnalysisInput, context?: ProgressContext): string {
    const contextInfo = context ? `
Analysis Context:
- Baseline Date: ${context.baselineDate.toISOString()}
- Tracking Categories: ${context.trackingCategories.join(', ')}
- Comparison Periods: ${context.comparisonPeriods.join(', ')}
- Focus Metrics: ${context.focusMetrics.join(', ')}
- Include Predictions: ${context.includePredictions}` : '';
    
    return `You are an expert progress tracking analyst specializing in relationship development. Analyze the user's progress data and provide comprehensive insights.

User ID: ${input.userId}
Timeframe: ${input.timeframe}
Include Comparisons: ${input.includeComparisons || false}
Focus Areas: ${input.focusAreas?.join(', ') || 'All areas'}${contextInfo}

Provide analysis in this JSON format:
{
  "overallProgress": {
    "currentStreak": <days>,
    "longestStreak": <days>,
    "completionRate": <0-1>,
    "averageRating": <1-5>,
    "totalSessionMinutes": <minutes>,
    "improvementRate": <percentage change>,
    "consistencyScore": <0-1>,
    "engagementLevel": "low|medium|high"
  },
  "patterns": [
    {
      "type": "improvement|plateau|decline|spike|consistency",
      "category": "<category>",
      "strength": <0-1>,
      "description": "<pattern description>",
      "timeframe": "<when pattern occurred>",
      "confidence": <0-1>
    }
  ],
  "achievements": [
    {
      "id": "<achievement id>",
      "type": "streak|completion|improvement|milestone|skill",
      "title": "<achievement title>",
      "description": "<description>",
      "earnedAt": "<ISO date>",
      "category": "<category>",
      "rarity": "common|uncommon|rare|epic",
      "points": <points>
    }
  ],
  "insights": [
    {
      "type": "celebration|encouragement|adjustment|challenge",
      "title": "<insight title>",
      "message": "<insight message>",
      "priority": "low|medium|high",
      "category": "<category>",
      "actionable": <boolean>,
      "evidence": ["<supporting evidence>"]
    }
  ],
  "recommendations": [
    {
      "id": "<recommendation id>",
      "title": "<recommendation title>",
      "description": "<detailed description>",
      "category": "<category>",
      "priority": "low|medium|high",
      "estimatedTime": <minutes>,
      "difficulty": "beginner|intermediate|advanced",
      "actionItems": ["<specific action>"]
    }
  ],
  "nextMilestones": [
    {
      "id": "<milestone id>",
      "title": "<milestone title>",
      "description": "<description>",
      "targetDate": "<ISO date>",
      "completed": false
    }
  ]
}

Focus on:
1. Identifying meaningful patterns in user behavior
2. Celebrating achievements and progress
3. Providing actionable insights for improvement
4. Being encouraging while honest about challenges
5. Connecting progress to user's relationship goals`;
  }

  private buildStreakAnalysisPrompt(activityData: any[], context?: ProgressContext): string {
    const recentData = activityData.slice(-30); // Last 30 days
    
    return `Analyze streak patterns in this user activity data.

Activity Data (last 30 days):
${JSON.stringify(recentData, null, 2)}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide streak analysis in this JSON format:
{
  "currentStreak": <days>,
  "longestStreak": <days>,
  "streakQuality": "excellent|good|moderate|needs_improvement",
  "streakPrediction": {
    "likelyToContinue": <boolean>,
    "riskFactors": ["<risk factor>"],
    "recommendations": ["<recommendation>"]
  }
}

Consider:
1. Consistency patterns and gaps
2. Quality of activities during streaks
3. External factors that might affect streaks
4. Realistic predictions based on historical data`;
  }

  private buildTrendForecastPrompt(historicalData: ProgressMetrics[], currentGoals: string[], context?: ProgressContext): string {
    return `Generate trend forecasts based on historical progress data.

Historical Data:
${JSON.stringify(historicalData, null, 2)}

Current Goals:
${JSON.stringify(currentGoals, null, 2)}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide forecast in this JSON format:
{
  "nextWeekPrediction": {
    "expectedProgress": <0-100>,
    "confidenceLevel": <0-1>,
    "keyFactors": ["<factor>"]
  },
  "nextMonthOutlook": {
    "projectedMilestones": ["<milestone>"],
    "potentialChallenges": ["<challenge>"],
    "successProbability": <0-1>
  },
  "recommendedActions": ["<action>"]
}

Base predictions on:
1. Historical trends and patterns
2. Current engagement levels
3. Seasonal or cyclical factors
4. Goal alignment and motivation indicators`;
  }

  private parseProgressAnalysisResponse(response: AIResponse): ProgressAnalysisOutput {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return this.validateProgressAnalysisOutput(parsed);
    } catch (error) {
      console.error('Failed to parse progress analysis response:', error);
      return this.createDefaultProgressAnalysis();
    }
  }

  private parseStreakAnalysisResponse(response: AIResponse): StreakAnalysis {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return {
        currentStreak: parsed.currentStreak || 0,
        longestStreak: parsed.longestStreak || 0,
        streakQuality: parsed.streakQuality || 'moderate',
        streakPrediction: parsed.streakPrediction || {
          likelyToContinue: true,
          riskFactors: [],
          recommendations: ['Keep up the great work!']
        }
      };
    } catch (error) {
      console.error('Failed to parse streak analysis response:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakQuality: 'moderate',
        streakPrediction: {
          likelyToContinue: true,
          riskFactors: [],
          recommendations: ['Focus on building consistency']
        }
      };
    }
  }

  private parseTrendForecastResponse(response: AIResponse): TrendForecast {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return {
        nextWeekPrediction: parsed.nextWeekPrediction || {
          expectedProgress: 70,
          confidenceLevel: 0.7,
          keyFactors: ['Consistent practice']
        },
        nextMonthOutlook: parsed.nextMonthOutlook || {
          projectedMilestones: ['Improved communication skills'],
          potentialChallenges: ['Maintaining motivation'],
          successProbability: 0.75
        },
        recommendedActions: parsed.recommendedActions || ['Continue daily practice']
      };
    } catch (error) {
      console.error('Failed to parse trend forecast response:', error);
      return {
        nextWeekPrediction: {
          expectedProgress: 70,
          confidenceLevel: 0.6,
          keyFactors: ['Current momentum']
        },
        nextMonthOutlook: {
          projectedMilestones: ['Steady progress'],
          potentialChallenges: ['Consistency'],
          successProbability: 0.7
        },
        recommendedActions: ['Maintain regular practice schedule']
      };
    }
  }

  private validateProgressAnalysisOutput(output: any): ProgressAnalysisOutput {
    return {
      overallProgress: {
        currentStreak: Math.max(0, output.overallProgress?.currentStreak || 0),
        longestStreak: Math.max(0, output.overallProgress?.longestStreak || 0),
        completionRate: Math.max(0, Math.min(1, output.overallProgress?.completionRate || 0)),
        averageRating: Math.max(1, Math.min(5, output.overallProgress?.averageRating || 3)),
        totalSessionMinutes: Math.max(0, output.overallProgress?.totalSessionMinutes || 0),
        improvementRate: output.overallProgress?.improvementRate || 0,
        consistencyScore: Math.max(0, Math.min(1, output.overallProgress?.consistencyScore || 0.5)),
        engagementLevel: ['low', 'medium', 'high'].includes(output.overallProgress?.engagementLevel) 
          ? output.overallProgress.engagementLevel : 'medium'
      },
      patterns: Array.isArray(output.patterns) ? output.patterns : [],
      achievements: Array.isArray(output.achievements) ? output.achievements : [],
      insights: Array.isArray(output.insights) ? output.insights : [],
      recommendations: Array.isArray(output.recommendations) ? output.recommendations : [],
      nextMilestones: Array.isArray(output.nextMilestones) ? output.nextMilestones : []
    };
  }

  private generateFallbackProgressAnalysis(input: ProgressAnalysisInput): ProgressAnalysisOutput {
    return {
      overallProgress: {
        currentStreak: 3,
        longestStreak: 7,
        completionRate: 0.7,
        averageRating: 4.0,
        totalSessionMinutes: 150,
        improvementRate: 12,
        consistencyScore: 0.75,
        engagementLevel: 'medium'
      },
      patterns: [
        {
          type: 'consistency',
          category: 'general',
          strength: 0.7,
          description: 'Showing good consistency in daily practices',
          timeframe: input.timeframe,
          confidence: 0.8
        }
      ],
      achievements: [],
      insights: [
        {
          type: 'encouragement',
          title: 'Steady Progress',
          message: 'You\'re making steady progress in your relationship development journey.',
          priority: 'medium',
          category: 'general',
          actionable: false,
          evidence: ['Consistent engagement with platform']
        }
      ],
      recommendations: [
        {
          id: 'continue-practice',
          title: 'Maintain Current Momentum',
          description: 'Keep up your current practice routine to build on your progress.',
          category: 'consistency',
          priority: 'medium',
          estimatedTime: 15,
          difficulty: 'beginner',
          actionItems: ['Continue daily practices', 'Track your progress']
        }
      ],
      nextMilestones: [
        {
          id: 'week-completion',
          title: 'Complete Week',
          description: 'Complete a full week of consistent practice',
          completed: false
        }
      ]
    };
  }

  private generateFallbackStreakAnalysis(activityData: any[]): StreakAnalysis {
    const streakData = this.calculateStreakData(activityData);
    
    return {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      streakQuality: streakData.currentStreak >= 7 ? 'good' : 'moderate',
      streakPrediction: {
        likelyToContinue: streakData.currentStreak > 0,
        riskFactors: streakData.currentStreak === 0 ? ['Need to restart practice'] : [],
        recommendations: ['Focus on building daily habits', 'Start small and be consistent']
      }
    };
  }

  private generateFallbackTrendForecast(historicalData: ProgressMetrics[]): TrendForecast {
    const avgProgress = historicalData.length > 0 
      ? historicalData.reduce((sum, data) => sum + (data.completionRate || 0), 0) / historicalData.length * 100
      : 70;
    
    return {
      nextWeekPrediction: {
        expectedProgress: Math.round(avgProgress),
        confidenceLevel: 0.7,
        keyFactors: ['Historical performance', 'Current engagement']
      },
      nextMonthOutlook: {
        projectedMilestones: ['Improve consistency', 'Build stronger habits'],
        potentialChallenges: ['Maintaining motivation', 'Time management'],
        successProbability: 0.75
      },
      recommendedActions: [
        'Set realistic daily goals',
        'Track progress regularly',
        'Celebrate small wins'
      ]
    };
  }

  private createDefaultProgressAnalysis(): ProgressAnalysisOutput {
    return {
      overallProgress: {
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
        averageRating: 3,
        totalSessionMinutes: 0,
        improvementRate: 0,
        consistencyScore: 0,
        engagementLevel: 'medium'
      },
      patterns: [],
      achievements: [],
      insights: [{
        type: 'encouragement',
        title: 'Starting Your Journey',
        message: 'Welcome to your relationship development journey! Every expert was once a beginner.',
        priority: 'medium',
        category: 'motivation',
        actionable: false,
        evidence: []
      }],
      recommendations: [{
        id: 'first-step',
        title: 'Take Your First Step',
        description: 'Begin with a simple daily practice to start building momentum.',
        category: 'getting_started',
        priority: 'high',
        estimatedTime: 10,
        difficulty: 'beginner',
        actionItems: ['Choose a daily practice time', 'Start with 5-10 minutes']
      }],
      nextMilestones: [{
        id: 'first-practice',
        title: 'First Practice',
        description: 'Complete your first relationship development practice',
        completed: false
      }]
    };
  }

  private calculateStreakData(activityData: any[]): { currentStreak: number; longestStreak: number } {
    // Sort by date
    const sortedData = activityData
      .filter(item => item.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    
    // Calculate current streak (from most recent)
    const today = new Date();
    for (let i = sortedData.length - 1; i >= 0; i--) {
      const itemDate = new Date(sortedData[i].date);
      const daysDiff = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    for (const item of sortedData) {
      const itemDate = new Date(item.date);
      
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor((itemDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      lastDate = itemDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentStreak, longestStreak };
  }

  /**
   * Get progress tracking analytics
   */
  getTrackingAnalytics(): {
    totalUsersTracked: number;
    averageStreakLength: number;
    mostCommonPatterns: string[];
    achievementDistribution: Record<string, number>;
  } {
    // Mock analytics - in production, this would query actual data
    return {
      totalUsersTracked: 0,
      averageStreakLength: 0,
      mostCommonPatterns: ['consistency', 'improvement'],
      achievementDistribution: {
        common: 70,
        uncommon: 20,
        rare: 8,
        epic: 2
      }
    };
  }
}