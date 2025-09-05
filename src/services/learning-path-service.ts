import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { cache } from '../lib/cache-enhanced';

type LearningPath = Database['public']['Tables']['learning_paths']['Row'];
type LearningPathInsert = Database['public']['Tables']['learning_paths']['Insert'];
type LearningPathUpdate = Database['public']['Tables']['learning_paths']['Update'];

interface CreateLearningPathRequest {
  name: string;
  description: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags?: string[];
  prerequisites?: string[];
  learning_objectives: string[];
  estimated_duration_weeks?: number;
  content_items?: any;
  is_template?: boolean;
  template_id?: string;
}

interface LearningPathFilters {
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  completed?: boolean;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'progress_percentage' | 'difficulty';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface LearningPathStats {
  total_paths: number;
  completed_paths: number;
  in_progress_paths: number;
  average_progress: number;
  total_time_spent_hours: number;
  favorite_categories: { category: string; count: number }[];
  completion_rate_by_difficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

class LearningPathService {
  private cacheKey = 'learning_paths';
  private cacheTTL = 300; // 5 minutes

  /**
   * Create a new learning path
   */
  async createLearningPath(
    userId: string,
    pathData: CreateLearningPathRequest
  ): Promise<{ data: LearningPath | null; error: any }> {
    try {
      const insertData: LearningPathInsert = {
        user_id: userId,
        name: pathData.name,
        description: pathData.description,
        difficulty: pathData.difficulty || 'beginner',
        category: pathData.category,
        tags: pathData.tags || [],
        prerequisites: pathData.prerequisites || null,
        learning_objectives: pathData.learning_objectives,
        estimated_duration_weeks: pathData.estimated_duration_weeks || 4,
        content_items: pathData.content_items || {},
        is_template: pathData.is_template || false,
        template_id: pathData.template_id || null,
        practices: [], // Legacy field
        completed: false,
        progress_percentage: 0,
        version: 1,
        metadata: {
          created_source: 'user_created',
          ai_enhanced: false
        }
      };

      const { data, error } = await supabase
        .from('learning_paths')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Invalidate user's cache
      await this.invalidateUserCache(userId);

      return { data, error: null };
    } catch (error) {
      console.error('Error creating learning path:', error);
      return { data: null, error };
    }
  }

  /**
   * Get learning paths for a user with filters
   */
  async getLearningPaths(
    userId: string,
    filters: LearningPathFilters = {}
  ): Promise<{ data: LearningPath[] | null; error: any; pagination?: { total: number; has_more: boolean } }> {
    try {
      const cacheKey = `${this.cacheKey}_${userId}_${JSON.stringify(filters)}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      let query = supabase
        .from('learning_paths')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      if (filters.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const result = {
        data,
        error: null,
        pagination: {
          total: count || 0,
          has_more: filters.limit ? (count || 0) > (filters.offset || 0) + (filters.limit || 10) : false
        }
      };

      await cache.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a specific learning path by ID
   */
  async getLearningPath(
    userId: string,
    pathId: string
  ): Promise<{ data: LearningPath | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_single_${pathId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const result = { data, error: null };
      await cache.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching learning path:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a learning path
   */
  async updateLearningPath(
    userId: string,
    pathId: string,
    updates: Partial<CreateLearningPathRequest>
  ): Promise<{ data: LearningPath | null; error: any }> {
    try {
      const updateData: LearningPathUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
        version: undefined // Will be incremented by trigger
      };

      const { data, error } = await supabase
        .from('learning_paths')
        .update(updateData)
        .eq('id', pathId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate caches
      await this.invalidateUserCache(userId);
      await cache.delete(`${this.cacheKey}_single_${pathId}`);

      return { data, error: null };
    } catch (error) {
      console.error('Error updating learning path:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a learning path
   */
  async deleteLearningPath(
    userId: string,
    pathId: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('learning_paths')
        .delete()
        .eq('id', pathId)
        .eq('user_id', userId);

      if (error) throw error;

      // Invalidate caches
      await this.invalidateUserCache(userId);
      await cache.delete(`${this.cacheKey}_single_${pathId}`);

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting learning path:', error);
      return { success: false, error };
    }
  }

  /**
   * Update learning path progress
   */
  async updateProgress(
    userId: string,
    pathId: string,
    progressPercentage: number,
    completed?: boolean
  ): Promise<{ data: LearningPath | null; error: any }> {
    try {
      const updateData: LearningPathUpdate = {
        progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
        completed: completed || progressPercentage >= 100,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('learning_paths')
        .update(updateData)
        .eq('id', pathId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate caches
      await this.invalidateUserCache(userId);
      await cache.delete(`${this.cacheKey}_single_${pathId}`);

      return { data, error: null };
    } catch (error) {
      console.error('Error updating learning path progress:', error);
      return { data: null, error };
    }
  }

  /**
   * Clone a learning path (from template or existing path)
   */
  async cloneLearningPath(
    userId: string,
    sourcePathId: string,
    newName?: string
  ): Promise<{ data: LearningPath | null; error: any }> {
    try {
      // Get the source path
      const { data: sourcePath, error: fetchError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', sourcePathId)
        .single();

      if (fetchError) throw fetchError;
      if (!sourcePath) throw new Error('Source path not found');

      // Create the cloned path
      const cloneData: LearningPathInsert = {
        user_id: userId,
        name: newName || `${sourcePath.name} (Copy)`,
        description: sourcePath.description,
        difficulty: sourcePath.difficulty,
        category: sourcePath.category,
        tags: sourcePath.tags,
        prerequisites: sourcePath.prerequisites,
        learning_objectives: sourcePath.learning_objectives,
        estimated_duration_weeks: sourcePath.estimated_duration_weeks,
        content_items: sourcePath.content_items,
        is_template: false,
        template_id: sourcePath.is_template ? sourcePath.id : sourcePath.template_id,
        practices: sourcePath.practices,
        completed: false,
        progress_percentage: 0,
        version: 1,
        metadata: {
          ...sourcePath.metadata as any,
          cloned_from: sourcePathId,
          cloned_at: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('learning_paths')
        .insert([cloneData])
        .select()
        .single();

      if (error) throw error;

      // Invalidate user's cache
      await this.invalidateUserCache(userId);

      return { data, error: null };
    } catch (error) {
      console.error('Error cloning learning path:', error);
      return { data: null, error };
    }
  }

  /**
   * Get learning path templates
   */
  async getTemplates(
    filters: Omit<LearningPathFilters, 'completed'> = {}
  ): Promise<{ data: LearningPath[] | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_templates_${JSON.stringify(filters)}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      let query = supabase
        .from('learning_paths')
        .select('*')
        .eq('is_template', true);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      const result = { data, error: null };
      await cache.set(cacheKey, result, this.cacheTTL * 2); // Templates cache longer
      return result;
    } catch (error) {
      console.error('Error fetching learning path templates:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user learning path statistics
   */
  async getUserStats(userId: string): Promise<{ data: LearningPathStats | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_stats_${userId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      // Get basic path stats
      const { data: paths, error: pathsError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', userId);

      if (pathsError) throw pathsError;
      if (!paths) return { data: null, error: null };

      const totalPaths = paths.length;
      const completedPaths = paths.filter(p => p.completed).length;
      const inProgressPaths = paths.filter(p => p.progress_percentage > 0 && !p.completed).length;
      const averageProgress = paths.length > 0 
        ? paths.reduce((sum, p) => sum + p.progress_percentage, 0) / paths.length 
        : 0;

      // Calculate category distribution
      const categoryCount: Record<string, number> = {};
      paths.forEach(path => {
        categoryCount[path.category] = (categoryCount[path.category] || 0) + 1;
      });

      const favoriteCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate completion rate by difficulty
      const completionRateByDifficulty = {
        beginner: this.calculateCompletionRate(paths, 'beginner'),
        intermediate: this.calculateCompletionRate(paths, 'intermediate'),
        advanced: this.calculateCompletionRate(paths, 'advanced')
      };

      const stats: LearningPathStats = {
        total_paths: totalPaths,
        completed_paths: completedPaths,
        in_progress_paths: inProgressPaths,
        average_progress: Math.round(averageProgress * 100) / 100,
        total_time_spent_hours: 0, // Would need to calculate from progress data
        favorite_categories: favoriteCategories.slice(0, 5),
        completion_rate_by_difficulty: completionRateByDifficulty
      };

      const result = { data: stats, error: null };
      await cache.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching learning path stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Search learning paths across all users (for discovery)
   */
  async searchPublicPaths(
    query: string,
    filters: Omit<LearningPathFilters, 'completed'> = {}
  ): Promise<{ data: LearningPath[] | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_public_search_${query}_${JSON.stringify(filters)}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      let dbQuery = supabase
        .from('learning_paths')
        .select('*')
        .eq('is_template', true) // Only show templates for public search
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

      if (filters.category) {
        dbQuery = dbQuery.eq('category', filters.category);
      }

      if (filters.difficulty) {
        dbQuery = dbQuery.eq('difficulty', filters.difficulty);
      }

      if (filters.tags?.length) {
        dbQuery = dbQuery.overlaps('tags', filters.tags);
      }

      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';
      dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      if (filters.limit) {
        dbQuery = dbQuery.limit(filters.limit);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;

      const result = { data, error: null };
      await cache.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      console.error('Error searching public learning paths:', error);
      return { data: null, error };
    }
  }

  /**
   * Private helper methods
   */
  private calculateCompletionRate(paths: LearningPath[], difficulty: string): number {
    const pathsOfDifficulty = paths.filter(p => p.difficulty === difficulty);
    if (pathsOfDifficulty.length === 0) return 0;
    
    const completed = pathsOfDifficulty.filter(p => p.completed).length;
    return Math.round((completed / pathsOfDifficulty.length) * 100);
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `${this.cacheKey}_${userId}_*`,
      `${this.cacheKey}_stats_${userId}`
    ];
    
    for (const pattern of patterns) {
      await cache.deleteByPattern(pattern);
    }
  }
}

export const learningPathService = new LearningPathService();
export type { LearningPath, CreateLearningPathRequest, LearningPathFilters, LearningPathStats };