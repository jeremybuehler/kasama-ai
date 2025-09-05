import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schemas
export const createAssessmentSchema = z.object({
  type: z.enum(['initial', 'progress', 'relationship_health', 'communication_skills', 'goal_assessment']),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.enum(['multiple_choice', 'scale', 'text', 'boolean']),
    options: z.array(z.string()).optional(),
    required: z.boolean().default(true)
  })),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  estimatedMinutes: z.number().min(1).max(120),
  category: z.string().optional()
});

export const submitAssessmentSchema = z.object({
  assessmentId: z.string(),
  responses: z.array(z.object({
    questionId: z.string(),
    answer: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
  })),
  timeSpentSeconds: z.number().min(0).optional(),
  notes: z.string().max(1000).optional()
});

export const assessmentAnalysisSchema = z.object({
  userId: z.string(),
  assessmentId: z.string(),
  analysisType: z.enum(['basic', 'detailed', 'comparative', 'trend']).default('basic'),
  compareWithPrevious: z.boolean().default(false),
  includeRecommendations: z.boolean().default(true)
});

export interface Assessment {
  id: string;
  type: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  estimatedMinutes: number;
  category?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'boolean';
  options?: string[];
  required: boolean;
  order: number;
}

export interface AssessmentResponse {
  id: string;
  userId: string;
  assessmentId: string;
  responses: {
    questionId: string;
    answer: string | number | boolean | string[];
  }[];
  score?: number;
  analysis?: any;
  timeSpentSeconds?: number;
  notes?: string;
  completedAt: string;
  createdAt: string;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  assessmentId: string;
  assessment: Assessment;
  responses: AssessmentResponse['responses'];
  score: number;
  percentile?: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  insights: any;
  completedAt: string;
}

export class AssessmentService {
  static async createAssessment(data: z.infer<typeof createAssessmentSchema>, createdBy?: string) {
    try {
      const { data: assessment, error } = await supabase
        .from('assessments')
        .insert({
          type: data.type,
          title: data.title,
          description: data.description,
          questions: data.questions,
          estimated_minutes: data.estimatedMinutes,
          category: data.category,
          is_active: true,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create assessment');
      }

      return this.formatAssessment(assessment);
    } catch (error) {
      throw error;
    }
  }

  static async getAssessment(assessmentId: string): Promise<Assessment> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Assessment not found');
      }

      return this.formatAssessment(data);
    } catch (error) {
      throw error;
    }
  }

  static async getAssessments(filters: {
    type?: string;
    category?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = supabase
        .from('assessments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch assessments');
      }

      return data.map(assessment => this.formatAssessment(assessment));
    } catch (error) {
      throw error;
    }
  }

  static async submitAssessment(userId: string, data: z.infer<typeof submitAssessmentSchema>) {
    try {
      // Get assessment details
      const assessment = await this.getAssessment(data.assessmentId);

      // Calculate score based on assessment type and responses
      const score = await this.calculateScore(assessment, data.responses);

      // Generate analysis
      const analysis = await this.generateAnalysis(userId, assessment, data.responses, score);

      // Save response
      const { data: response, error } = await supabase
        .from('assessment_responses')
        .insert({
          user_id: userId,
          assessment_id: data.assessmentId,
          responses: data.responses,
          score,
          analysis,
          time_spent_seconds: data.timeSpentSeconds,
          notes: data.notes,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to save assessment response');
      }

      // Update user stats
      await this.updateUserStats(userId, score);

      // Check for badge achievements
      await this.checkBadgeAchievements(userId, assessment.type, score);

      return {
        id: response.id,
        score,
        analysis,
        completedAt: response.completed_at
      };
    } catch (error) {
      throw error;
    }
  }

  static async getUserAssessmentResults(
    userId: string, 
    filters: {
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AssessmentResult[]> {
    try {
      let query = supabase
        .from('assessment_responses')
        .select(`
          *,
          assessments (
            id,
            type,
            title,
            description,
            category,
            questions,
            estimated_minutes
          )
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (filters.type) {
        query = query.eq('assessments.type', filters.type);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch assessment results');
      }

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        assessmentId: item.assessment_id,
        assessment: this.formatAssessment(item.assessments),
        responses: item.responses,
        score: item.score,
        percentile: item.analysis?.percentile,
        strengths: item.analysis?.strengths || [],
        areasForImprovement: item.analysis?.areas_for_improvement || [],
        recommendations: item.analysis?.recommendations || [],
        insights: item.analysis?.insights || {},
        completedAt: item.completed_at
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getAssessmentAnalysis(data: z.infer<typeof assessmentAnalysisSchema>) {
    try {
      const results = await this.getUserAssessmentResults(data.userId, {
        limit: data.compareWithPrevious ? 5 : 1
      });

      if (results.length === 0) {
        throw new Error('No assessment results found');
      }

      const latestResult = results[0];
      let analysis: any = {
        currentScore: latestResult.score,
        strengths: latestResult.strengths,
        areasForImprovement: latestResult.areasForImprovement,
        recommendations: latestResult.recommendations,
        completedAt: latestResult.completedAt
      };

      if (data.analysisType === 'detailed') {
        analysis.detailedInsights = await this.generateDetailedInsights(latestResult);
      }

      if (data.compareWithPrevious && results.length > 1) {
        const previousResult = results[1];
        analysis.comparison = {
          scoreDifference: latestResult.score - previousResult.score,
          improvement: latestResult.score > previousResult.score,
          trends: await this.analyzeTrends(results)
        };
      }

      if (data.analysisType === 'trend' && results.length > 2) {
        analysis.trendAnalysis = await this.analyzeLongTermTrends(results);
      }

      return analysis;
    } catch (error) {
      throw error;
    }
  }

  static async getAssessmentStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('assessment_id, score, completed_at, assessments!inner(type)')
        .eq('user_id', userId);

      if (error) {
        throw new Error('Failed to fetch assessment stats');
      }

      const stats = {
        totalCompleted: data.length,
        averageScore: 0,
        byType: {} as Record<string, { count: number; averageScore: number; lastCompleted?: string }>,
        recentActivity: data.slice(0, 5).map(item => ({
          type: item.assessments.type,
          score: item.score,
          completedAt: item.completed_at
        }))
      };

      if (data.length > 0) {
        stats.averageScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;

        // Group by type
        const grouped = data.reduce((acc, item) => {
          const type = item.assessments.type;
          if (!acc[type]) {
            acc[type] = { scores: [], dates: [] };
          }
          acc[type].scores.push(item.score);
          acc[type].dates.push(item.completed_at);
          return acc;
        }, {} as Record<string, { scores: number[]; dates: string[] }>);

        Object.entries(grouped).forEach(([type, data]) => {
          stats.byType[type] = {
            count: data.scores.length,
            averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
            lastCompleted: Math.max(...data.dates.map(d => new Date(d).getTime())).toString()
          };
        });
      }

      return stats;
    } catch (error) {
      throw error;
    }
  }

  static async getRecommendedAssessments(userId: string) {
    try {
      // Get user's completed assessments
      const completedAssessments = await supabase
        .from('assessment_responses')
        .select('assessment_id')
        .eq('user_id', userId);

      const completedIds = completedAssessments.data?.map(r => r.assessment_id) || [];

      // Get user profile for personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('relationship_status, goals, challenges')
        .eq('id', userId)
        .single();

      // Find recommended assessments based on profile and completion history
      let query = supabase
        .from('assessments')
        .select('*')
        .eq('is_active', true)
        .limit(5);

      if (completedIds.length > 0) {
        query = query.not('id', 'in', `(${completedIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch recommended assessments');
      }

      // Score recommendations based on user profile
      const scored = data.map(assessment => {
        let relevanceScore = 0;

        // Boost score based on relationship status
        if (profile?.relationship_status && assessment.category?.includes(profile.relationship_status)) {
          relevanceScore += 20;
        }

        // Boost score based on user goals
        if (profile?.goals) {
          profile.goals.forEach((goal: string) => {
            if (assessment.title.toLowerCase().includes(goal.toLowerCase()) ||
                assessment.description?.toLowerCase().includes(goal.toLowerCase())) {
              relevanceScore += 15;
            }
          });
        }

        // Boost score for initial assessments if user is new
        if (completedIds.length === 0 && assessment.type === 'initial') {
          relevanceScore += 30;
        }

        return {
          ...this.formatAssessment(assessment),
          relevanceScore
        };
      });

      // Sort by relevance score
      scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return scored.map(({ relevanceScore, ...assessment }) => assessment);
    } catch (error) {
      throw error;
    }
  }

  private static formatAssessment(data: any): Assessment {
    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      questions: data.questions || [],
      estimatedMinutes: data.estimated_minutes,
      category: data.category,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private static async calculateScore(assessment: Assessment, responses: any[]): Promise<number> {
    // Implement scoring logic based on assessment type
    let totalScore = 0;
    let maxPossibleScore = 0;

    assessment.questions.forEach((question, index) => {
      const response = responses.find(r => r.questionId === question.id);
      if (!response) return;

      maxPossibleScore += 10; // Each question worth 10 points

      switch (question.type) {
        case 'scale':
          if (typeof response.answer === 'number') {
            totalScore += Math.min(response.answer, 10);
          }
          break;
        case 'multiple_choice':
          // Simple scoring - could be enhanced with weighted options
          totalScore += 5;
          break;
        case 'boolean':
          totalScore += response.answer ? 10 : 0;
          break;
        case 'text':
          // Text responses get partial score
          totalScore += 7;
          break;
      }
    });

    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  private static async generateAnalysis(
    userId: string, 
    assessment: Assessment, 
    responses: any[], 
    score: number
  ) {
    // Generate AI-powered analysis (this would integrate with your AI service)
    const strengths = [];
    const areasForImprovement = [];
    const recommendations = [];

    // Basic analysis based on score ranges
    if (score >= 80) {
      strengths.push('Strong overall performance in this area');
    } else if (score >= 60) {
      strengths.push('Good foundation with room for growth');
    } else {
      areasForImprovement.push('This area would benefit from focused attention');
    }

    // Type-specific analysis
    switch (assessment.type) {
      case 'relationship_health':
        if (score >= 80) {
          recommendations.push('Continue nurturing your relationship with regular check-ins');
        } else {
          recommendations.push('Consider scheduling more quality time together');
        }
        break;
      case 'communication_skills':
        if (score < 70) {
          recommendations.push('Practice active listening exercises');
          recommendations.push('Work on expressing emotions constructively');
        }
        break;
    }

    return {
      strengths,
      areas_for_improvement: areasForImprovement,
      recommendations,
      insights: {
        scorePercentile: await this.calculatePercentile(assessment.id, score),
        completionRate: (responses.length / assessment.questions.length) * 100
      }
    };
  }

  private static async calculatePercentile(assessmentId: string, score: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('score')
        .eq('assessment_id', assessmentId);

      if (error || !data.length) return 50; // Default percentile

      const scores = data.map(r => r.score).sort((a, b) => a - b);
      const position = scores.findIndex(s => s >= score);
      
      return Math.round((position / scores.length) * 100);
    } catch (error) {
      return 50; // Default percentile on error
    }
  }

  private static async updateUserStats(userId: string, score: number) {
    try {
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (currentStats) {
        await supabase
          .from('user_stats')
          .update({
            total_completed_lessons: currentStats.total_completed_lessons + 1,
            experience_points: currentStats.experience_points + Math.floor(score / 10),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  }

  private static async checkBadgeAchievements(userId: string, assessmentType: string, score: number) {
    // Check for badge achievements based on assessment completion and score
    try {
      const achievements = [];

      if (score >= 90) {
        achievements.push('high_scorer');
      }

      if (assessmentType === 'initial') {
        achievements.push('assessment_starter');
      }

      // Award badges (this would be expanded with actual badge logic)
      for (const badgeId of achievements) {
        await supabase
          .from('user_badges')
          .upsert({
            user_id: userId,
            badge_id: badgeId,
            earned_at: new Date().toISOString()
          }, { onConflict: 'user_id,badge_id' });
      }
    } catch (error) {
      console.error('Failed to check badge achievements:', error);
    }
  }

  private static async generateDetailedInsights(result: AssessmentResult) {
    // Generate detailed insights based on responses
    return {
      responsePatterns: 'Analysis of response patterns',
      personalizedTips: ['Tip 1', 'Tip 2', 'Tip 3'],
      nextSteps: ['Next step 1', 'Next step 2']
    };
  }

  private static async analyzeTrends(results: AssessmentResult[]) {
    const scores = results.map(r => r.score);
    const trend = scores.length > 1 ? 
      (scores[0] - scores[scores.length - 1]) / (scores.length - 1) : 0;

    return {
      direction: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      averageChange: trend,
      consistency: this.calculateConsistency(scores)
    };
  }

  private static async analyzeLongTermTrends(results: AssessmentResult[]) {
    // Analyze long-term trends across multiple assessments
    return {
      overallProgress: 'steady improvement',
      keyMilestones: ['First assessment completed', 'Consistent high scores'],
      projectedGrowth: 'continued positive trend expected'
    };
  }

  private static calculateConsistency(scores: number[]): number {
    if (scores.length < 2) return 100;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 100 - stdDev);
  }
}