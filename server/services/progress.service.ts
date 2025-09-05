import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schemas
export const recordProgressSchema = z.object({
  activityType: z.enum(['lesson_completed', 'assessment_taken', 'goal_achieved', 'streak_maintained', 'content_created']),
  activityId: z.string(),
  points: z.number().min(0).max(1000),
  metadata: z.record(z.any()).optional(),
  completedAt: z.string().datetime().optional()
});

export const updateGoalProgressSchema = z.object({
  goalId: z.string(),
  progress: z.number().min(0).max(100),
  notes: z.string().max(500).optional(),
  milestones: z.array(z.string()).optional()
});

export const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetDate: z.string().datetime().optional(),
  category: z.string().max(50).optional(),
  criteria: z.record(z.any()).optional()
});

export interface ProgressEntry {
  id: string;
  userId: string;
  activityType: string;
  activityId: string;
  points: number;
  metadata?: any;
  completedAt: string;
  createdAt: string;
}

export interface GoalProgress {
  id: string;
  userId: string;
  goalId: string;
  goal: {
    id: string;
    title: string;
    description?: string;
    category: string;
    targetValue: number;
    unit: string;
    deadline?: string;
  };
  currentProgress: number;
  targetProgress: number;
  progressPercentage: number;
  milestones: Milestone[];
  lastUpdated: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  category?: string;
  criteria?: any;
  isCompleted: boolean;
  completedAt?: string;
  progress: number;
}

export interface ProgressStats {
  totalPoints: number;
  currentLevel: number;
  experiencePoints: number;
  streakCount: number;
  longestStreak: number;
  totalActivities: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyStats: {
    month: string;
    totalPoints: number;
    activitiesCompleted: number;
    goalsAchieved: number;
  };
  recentActivity: {
    date: string;
    activityType: string;
    points: number;
    description: string;
  }[];
}

export interface ProgressInsights {
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    changePercentage: number;
    timeframe: string;
  };
  achievements: {
    recentBadges: string[];
    nextBadge: string;
    progressToNextBadge: number;
  };
  recommendations: string[];
  strengths: string[];
  focusAreas: string[];
}

export class ProgressService {
  static async recordProgress(userId: string, data: z.infer<typeof recordProgressSchema>) {
    try {
      const completedAt = data.completedAt || new Date().toISOString();

      // Record progress entry
      const { data: progressEntry, error } = await supabase
        .from('progress_entries')
        .insert({
          user_id: userId,
          activity_type: data.activityType,
          activity_id: data.activityId,
          points: data.points,
          metadata: data.metadata,
          completed_at: completedAt,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to record progress');
      }

      // Update user stats
      await this.updateUserStats(userId, data.points, data.activityType);

      // Update streak if applicable
      await this.updateStreak(userId, completedAt);

      // Check for level up
      const levelUp = await this.checkLevelUp(userId);

      // Check for badge achievements
      const newBadges = await this.checkBadgeAchievements(userId, data.activityType, data.points);

      return {
        progressEntry,
        levelUp,
        newBadges,
        updatedStats: await this.getUserStats(userId)
      };
    } catch (error) {
      throw error;
    }
  }

  static async getUserStats(userId: string): Promise<ProgressStats> {
    try {
      // Get user stats
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError) {
        // Create initial stats if they don't exist
        const initialStats = await this.createInitialStats(userId);
        return this.formatProgressStats(initialStats, [], []);
      }

      // Get recent progress entries
      const { data: recentProgress } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(10);

      // Get monthly stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyProgress } = await supabase
        .from('progress_entries')
        .select('points, activity_type')
        .eq('user_id', userId)
        .gte('completed_at', startOfMonth.toISOString());

      return this.formatProgressStats(userStats, recentProgress || [], monthlyProgress || []);
    } catch (error) {
      throw error;
    }
  }

  static async getGoalProgress(userId: string, goalId?: string): Promise<GoalProgress[]> {
    try {
      let query = supabase
        .from('goal_progress')
        .select(`
          *,
          goals (
            id,
            title,
            description,
            category,
            target_value,
            unit,
            deadline
          ),
          milestones (
            id,
            title,
            description,
            target_date,
            category,
            criteria,
            is_completed,
            completed_at,
            progress
          )
        `)
        .eq('user_id', userId);

      if (goalId) {
        query = query.eq('goal_id', goalId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch goal progress');
      }

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        goalId: item.goal_id,
        goal: {
          id: item.goals.id,
          title: item.goals.title,
          description: item.goals.description,
          category: item.goals.category,
          targetValue: item.goals.target_value,
          unit: item.goals.unit,
          deadline: item.goals.deadline
        },
        currentProgress: item.current_progress,
        targetProgress: item.target_progress,
        progressPercentage: Math.round((item.current_progress / item.target_progress) * 100),
        milestones: item.milestones || [],
        lastUpdated: item.updated_at,
        isCompleted: item.is_completed,
        completedAt: item.completed_at
      }));
    } catch (error) {
      throw error;
    }
  }

  static async updateGoalProgress(userId: string, data: z.infer<typeof updateGoalProgressSchema>) {
    try {
      const { data: updated, error } = await supabase
        .from('goal_progress')
        .update({
          current_progress: data.progress,
          notes: data.notes,
          updated_at: new Date().toISOString(),
          is_completed: data.progress >= 100,
          completed_at: data.progress >= 100 ? new Date().toISOString() : null
        })
        .eq('user_id', userId)
        .eq('goal_id', data.goalId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update goal progress');
      }

      // Update milestones if provided
      if (data.milestones) {
        for (const milestoneId of data.milestones) {
          await supabase
            .from('milestones')
            .update({
              is_completed: true,
              completed_at: new Date().toISOString()
            })
            .eq('id', milestoneId)
            .eq('user_id', userId);
        }
      }

      // Record progress activity
      if (data.progress >= 100) {
        await this.recordProgress(userId, {
          activityType: 'goal_achieved',
          activityId: data.goalId,
          points: 100,
          metadata: { goalProgress: data.progress }
        });
      }

      return updated;
    } catch (error) {
      throw error;
    }
  }

  static async createMilestone(userId: string, goalId: string, data: z.infer<typeof createMilestoneSchema>) {
    try {
      const { data: milestone, error } = await supabase
        .from('milestones')
        .insert({
          user_id: userId,
          goal_id: goalId,
          title: data.title,
          description: data.description,
          target_date: data.targetDate,
          category: data.category,
          criteria: data.criteria,
          is_completed: false,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create milestone');
      }

      return milestone;
    } catch (error) {
      throw error;
    }
  }

  static async getProgressInsights(userId: string): Promise<ProgressInsights> {
    try {
      // Get progress data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentProgress } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: true });

      // Get user badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          badges (name, description)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(5);

      // Analyze trends
      const trends = this.analyzeTrends(recentProgress || []);

      // Get achievements
      const achievements = {
        recentBadges: userBadges?.map(ub => ub.badges.name) || [],
        nextBadge: 'Consistency Champion',
        progressToNextBadge: 65
      };

      // Generate recommendations
      const recommendations = await this.generateRecommendations(userId, recentProgress || []);

      // Identify strengths and focus areas
      const { strengths, focusAreas } = this.analyzePerformance(recentProgress || []);

      return {
        trends,
        achievements,
        recommendations,
        strengths,
        focusAreas
      };
    } catch (error) {
      throw error;
    }
  }

  static async getProgressChart(userId: string, timeframe: '7d' | '30d' | '90d' | '1y' = '30d') {
    try {
      const startDate = new Date();
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('progress_entries')
        .select('points, completed_at, activity_type')
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true });

      if (error) {
        throw new Error('Failed to fetch progress chart data');
      }

      // Group data by day
      const chartData = this.groupProgressByDay(data || []);

      return {
        timeframe,
        data: chartData,
        totalPoints: data?.reduce((sum, entry) => sum + entry.points, 0) || 0,
        averageDaily: chartData.length > 0 ? chartData.reduce((sum, day) => sum + day.points, 0) / chartData.length : 0
      };
    } catch (error) {
      throw error;
    }
  }

  static async getStreakInfo(userId: string) {
    try {
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('streak_count, longest_streak, last_activity_date')
        .eq('user_id', userId)
        .single();

      if (!userStats) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          streakStatus: 'none'
        };
      }

      const today = new Date();
      const lastActivity = userStats.last_activity_date ? new Date(userStats.last_activity_date) : null;
      const daysDiff = lastActivity ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;

      let streakStatus = 'active';
      if (daysDiff > 1) {
        streakStatus = 'broken';
      } else if (daysDiff === 1) {
        streakStatus = 'at_risk';
      }

      return {
        currentStreak: userStats.streak_count,
        longestStreak: userStats.longest_streak,
        lastActivityDate: userStats.last_activity_date,
        streakStatus
      };
    } catch (error) {
      throw error;
    }
  }

  private static async updateUserStats(userId: string, points: number, activityType: string) {
    try {
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (currentStats) {
        const newExperience = currentStats.experience_points + points;
        const newLevel = Math.floor(newExperience / 1000) + 1;

        await supabase
          .from('user_stats')
          .update({
            total_completed_lessons: currentStats.total_completed_lessons + (activityType === 'lesson_completed' ? 1 : 0),
            experience_points: newExperience,
            current_level: newLevel,
            last_activity_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  }

  private static async updateStreak(userId: string, completedAt: string) {
    try {
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!currentStats) return;

      const today = new Date(completedAt);
      const lastActivity = currentStats.last_activity_date ? new Date(currentStats.last_activity_date) : null;

      let newStreak = currentStats.streak_count;
      let longestStreak = currentStats.longest_streak;

      if (lastActivity) {
        const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Continue streak
          newStreak += 1;
          longestStreak = Math.max(longestStreak, newStreak);
        } else if (daysDiff > 1) {
          // Streak broken
          newStreak = 1;
        }
        // Same day = maintain current streak
      } else {
        // First activity
        newStreak = 1;
        longestStreak = 1;
      }

      await supabase
        .from('user_stats')
        .update({
          streak_count: newStreak,
          longest_streak: longestStreak
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  }

  private static async checkLevelUp(userId: string): Promise<boolean> {
    try {
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('current_level, experience_points')
        .eq('user_id', userId)
        .single();

      if (!currentStats) return false;

      const requiredExperience = currentStats.current_level * 1000;
      return currentStats.experience_points >= requiredExperience;
    } catch (error) {
      return false;
    }
  }

  private static async checkBadgeAchievements(userId: string, activityType: string, points: number): Promise<string[]> {
    // Implementation for badge achievement checking
    const newBadges: string[] = [];

    try {
      // Get user stats for badge criteria
      const stats = await this.getUserStats(userId);

      // Check various badge criteria
      if (stats.streakCount >= 7 && !await this.hasBadge(userId, 'week_streak')) {
        await this.awardBadge(userId, 'week_streak');
        newBadges.push('Week Streak');
      }

      if (stats.totalActivities >= 10 && !await this.hasBadge(userId, 'milestone_10')) {
        await this.awardBadge(userId, 'milestone_10');
        newBadges.push('10 Activities');
      }

      if (points >= 100 && !await this.hasBadge(userId, 'high_scorer')) {
        await this.awardBadge(userId, 'high_scorer');
        newBadges.push('High Scorer');
      }
    } catch (error) {
      console.error('Failed to check badge achievements:', error);
    }

    return newBadges;
  }

  private static async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  private static async awardBadge(userId: string, badgeId: string) {
    try {
      await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          earned_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to award badge:', error);
    }
  }

  private static async createInitialStats(userId: string) {
    const initialStats = {
      user_id: userId,
      streak_count: 0,
      longest_streak: 0,
      total_completed_lessons: 0,
      current_level: 1,
      experience_points: 0,
      last_activity_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('user_stats')
      .insert(initialStats);

    return initialStats;
  }

  private static formatProgressStats(userStats: any, recentProgress: any[], monthlyProgress: any[]): ProgressStats {
    const monthlyPoints = monthlyProgress.reduce((sum, entry) => sum + entry.points, 0);
    const monthlyActivities = monthlyProgress.length;
    const monthlyGoals = monthlyProgress.filter(entry => entry.activity_type === 'goal_achieved').length;

    return {
      totalPoints: userStats.experience_points || 0,
      currentLevel: userStats.current_level || 1,
      experiencePoints: userStats.experience_points || 0,
      streakCount: userStats.streak_count || 0,
      longestStreak: userStats.longest_streak || 0,
      totalActivities: userStats.total_completed_lessons || 0,
      weeklyGoal: 7, // Default weekly goal
      weeklyProgress: recentProgress.filter(entry => {
        const entryDate = new Date(entry.completed_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo;
      }).length,
      monthlyStats: {
        month: new Date().toLocaleString('default', { month: 'long' }),
        totalPoints: monthlyPoints,
        activitiesCompleted: monthlyActivities,
        goalsAchieved: monthlyGoals
      },
      recentActivity: recentProgress.map(entry => ({
        date: entry.completed_at,
        activityType: entry.activity_type,
        points: entry.points,
        description: this.getActivityDescription(entry.activity_type, entry.metadata)
      }))
    };
  }

  private static getActivityDescription(activityType: string, metadata: any): string {
    switch (activityType) {
      case 'lesson_completed':
        return 'Completed a lesson';
      case 'assessment_taken':
        return 'Took an assessment';
      case 'goal_achieved':
        return 'Achieved a goal';
      case 'streak_maintained':
        return 'Maintained streak';
      default:
        return 'Activity completed';
    }
  }

  private static analyzeTrends(progressEntries: any[]): ProgressInsights['trends'] {
    if (progressEntries.length < 2) {
      return {
        direction: 'stable',
        changePercentage: 0,
        timeframe: '30 days'
      };
    }

    const recentPoints = progressEntries.slice(-7).reduce((sum, entry) => sum + entry.points, 0);
    const previousPoints = progressEntries.slice(-14, -7).reduce((sum, entry) => sum + entry.points, 0);

    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    let changePercentage = 0;

    if (previousPoints > 0) {
      changePercentage = Math.round(((recentPoints - previousPoints) / previousPoints) * 100);
      
      if (changePercentage > 10) {
        direction = 'improving';
      } else if (changePercentage < -10) {
        direction = 'declining';
      }
    }

    return {
      direction,
      changePercentage: Math.abs(changePercentage),
      timeframe: '7 days'
    };
  }

  private static async generateRecommendations(userId: string, progressEntries: any[]): Promise<string[]> {
    const recommendations = [];

    // Analyze activity patterns
    const activityTypes = progressEntries.reduce((acc, entry) => {
      acc[entry.activity_type] = (acc[entry.activity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if ((activityTypes.lesson_completed || 0) < 3) {
      recommendations.push('Try completing more lessons to build consistent learning habits');
    }

    if ((activityTypes.assessment_taken || 0) < 1) {
      recommendations.push('Take assessments to track your progress and identify growth areas');
    }

    if (progressEntries.length === 0) {
      recommendations.push('Start your journey by completing your first activity');
    }

    return recommendations;
  }

  private static analyzePerformance(progressEntries: any[]): { strengths: string[]; focusAreas: string[] } {
    const strengths = [];
    const focusAreas = [];

    const totalPoints = progressEntries.reduce((sum, entry) => sum + entry.points, 0);
    const averagePoints = totalPoints / Math.max(progressEntries.length, 1);

    if (averagePoints > 50) {
      strengths.push('Consistent high-quality engagement');
    } else {
      focusAreas.push('Increase engagement depth for better results');
    }

    if (progressEntries.length > 20) {
      strengths.push('Excellent activity consistency');
    } else {
      focusAreas.push('Build more consistent activity patterns');
    }

    return { strengths, focusAreas };
  }

  private static groupProgressByDay(progressEntries: any[]) {
    const grouped = progressEntries.reduce((acc, entry) => {
      const date = entry.completed_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, points: 0, activities: 0 };
      }
      acc[date].points += entry.points;
      acc[date].activities += 1;
      return acc;
    }, {} as Record<string, { date: string; points: number; activities: number }>);

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }
}