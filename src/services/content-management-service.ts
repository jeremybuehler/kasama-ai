import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { cache } from '../lib/cache-enhanced';

type ContentItem = Database['public']['Tables']['content_items']['Row'];
type ContentItemInsert = Database['public']['Tables']['content_items']['Insert'];
type ContentItemUpdate = Database['public']['Tables']['content_items']['Update'];

interface CreateContentRequest {
  title: string;
  description: string;
  content_type: 'lesson' | 'article' | 'video' | 'audio' | 'exercise' | 'quiz' | 'scenario';
  content_data: any;
  category: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_time_minutes?: number;
  tags?: string[];
  prerequisites?: string[];
  learning_objectives: string[];
  media_urls?: any;
  interactive_elements?: any;
  status?: 'draft' | 'published' | 'archived';
}

interface ContentFilters {
  content_type?: 'lesson' | 'article' | 'video' | 'audio' | 'exercise' | 'quiz' | 'scenario';
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  created_by?: string;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'difficulty' | 'estimated_time_minutes';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface ContentStats {
  total_content: number;
  published_content: number;
  draft_content: number;
  content_by_type: { type: string; count: number }[];
  content_by_category: { category: string; count: number }[];
  average_completion_rate: number;
  most_popular_content: { id: string; title: string; views: number }[];
}

interface ContentVersion {
  id: string;
  content_item_id: string;
  version_number: number;
  title: string;
  content_data: any;
  changes_summary: string;
  created_by: string;
  created_at: string;
  metadata: any;
}

class ContentManagementService {
  private cacheKey = 'content_items';
  private cacheTTL = 600; // 10 minutes

  /**
   * Create new content item
   */
  async createContent(
    createdBy: string,
    contentData: CreateContentRequest
  ): Promise<{ data: ContentItem | null; error: any }> {
    try {
      const insertData: ContentItemInsert = {
        title: contentData.title,
        description: contentData.description,
        content_type: contentData.content_type,
        content_data: contentData.content_data,
        category: contentData.category,
        difficulty: contentData.difficulty || 'beginner',
        estimated_time_minutes: contentData.estimated_time_minutes || 15,
        tags: contentData.tags || [],
        prerequisites: contentData.prerequisites || null,
        learning_objectives: contentData.learning_objectives,
        media_urls: contentData.media_urls || {},
        interactive_elements: contentData.interactive_elements || {},
        status: contentData.status || 'draft',
        created_by: createdBy,
        version: 1,
        metadata: {
          content_source: 'user_created',
          ai_generated: false,
          created_timestamp: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('content_items')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Invalidate caches
      await this.invalidateContentCache();

      return { data, error: null };
    } catch (error) {
      console.error('Error creating content item:', error);
      return { data: null, error };
    }
  }

  /**
   * Get content items with filters and pagination
   */
  async getContent(
    filters: ContentFilters = {}
  ): Promise<{ 
    data: ContentItem[] | null; 
    error: any; 
    pagination?: { total: number; has_more: boolean } 
  }> {
    try {
      const cacheKey = `${this.cacheKey}_filtered_${JSON.stringify(filters)}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      let query = supabase
        .from('content_items')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.content_type) {
        query = query.eq('content_type', filters.content_type);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        // Default to published content only
        query = query.eq('status', 'published');
      }

      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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
      console.error('Error fetching content items:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a specific content item by ID
   */
  async getContentById(contentId: string): Promise<{ data: ContentItem | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_single_${contentId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;

      const result = { data, error: null };
      await cache.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching content item:', error);
      return { data: null, error };
    }
  }

  /**
   * Update content item
   */
  async updateContent(
    contentId: string,
    userId: string,
    updates: Partial<CreateContentRequest>
  ): Promise<{ data: ContentItem | null; error: any }> {
    try {
      // Check if user has permission to update
      const { data: existingContent } = await this.getContentById(contentId);
      if (!existingContent || existingContent.created_by !== userId) {
        throw new Error('Unauthorized to update this content');
      }

      const updateData: ContentItemUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
        version: existingContent.version + 1
      };

      // If content is being published, set published_at
      if (updates.status === 'published' && existingContent.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('content_items')
        .update(updateData)
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate caches
      await this.invalidateContentCache();
      await cache.delete(`${this.cacheKey}_single_${contentId}`);

      return { data, error: null };
    } catch (error) {
      console.error('Error updating content item:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete content item
   */
  async deleteContent(
    contentId: string,
    userId: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      // Check if user has permission to delete
      const { data: existingContent } = await this.getContentById(contentId);
      if (!existingContent || existingContent.created_by !== userId) {
        throw new Error('Unauthorized to delete this content');
      }

      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      // Invalidate caches
      await this.invalidateContentCache();
      await cache.delete(`${this.cacheKey}_single_${contentId}`);

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting content item:', error);
      return { success: false, error };
    }
  }

  /**
   * Duplicate content item
   */
  async duplicateContent(
    contentId: string,
    userId: string,
    newTitle?: string
  ): Promise<{ data: ContentItem | null; error: any }> {
    try {
      const { data: originalContent, error: fetchError } = await this.getContentById(contentId);
      if (fetchError || !originalContent) {
        throw fetchError || new Error('Content not found');
      }

      const duplicateData: CreateContentRequest = {
        title: newTitle || `${originalContent.title} (Copy)`,
        description: originalContent.description,
        content_type: originalContent.content_type,
        content_data: originalContent.content_data,
        category: originalContent.category,
        difficulty: originalContent.difficulty,
        estimated_time_minutes: originalContent.estimated_time_minutes,
        tags: originalContent.tags,
        prerequisites: originalContent.prerequisites,
        learning_objectives: originalContent.learning_objectives,
        media_urls: originalContent.media_urls,
        interactive_elements: originalContent.interactive_elements,
        status: 'draft' // Always create duplicates as drafts
      };

      return await this.createContent(userId, duplicateData);
    } catch (error) {
      console.error('Error duplicating content item:', error);
      return { data: null, error };
    }
  }

  /**
   * Get content categories with counts
   */
  async getContentCategories(): Promise<{ data: { category: string; count: number }[] | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_categories`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('content_items')
        .select('category')
        .eq('status', 'published');

      if (error) throw error;

      const categoryCount: Record<string, number> = {};
      data?.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });

      const categories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      const result = { data: categories, error: null };
      await cache.set(cacheKey, result, this.cacheTTL * 2);
      return result;
    } catch (error) {
      console.error('Error fetching content categories:', error);
      return { data: null, error };
    }
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<{ data: { tag: string; count: number }[] | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_tags_${limit}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('content_items')
        .select('tags')
        .eq('status', 'published');

      if (error) throw error;

      const tagCount: Record<string, number> = {};
      data?.forEach(item => {
        item.tags?.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      });

      const tags = Object.entries(tagCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      const result = { data: tags, error: null };
      await cache.set(cacheKey, result, this.cacheTTL * 2);
      return result;
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      return { data: null, error };
    }
  }

  /**
   * Search content with advanced filters
   */
  async searchContent(
    searchQuery: string,
    filters: Omit<ContentFilters, 'search'> = {}
  ): Promise<{ data: ContentItem[] | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_search_${searchQuery}_${JSON.stringify(filters)}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      // Enhanced search including tag and objective matching
      const searchFilters = {
        ...filters,
        search: searchQuery
      };

      const result = await this.getContent(searchFilters);
      
      await cache.set(cacheKey, result, this.cacheTTL / 2); // Shorter cache for search results
      return result;
    } catch (error) {
      console.error('Error searching content:', error);
      return { data: null, error };
    }
  }

  /**
   * Get content recommendations based on user preferences
   */
  async getRecommendedContent(
    userId: string,
    limit: number = 10
  ): Promise<{ data: ContentItem[] | null; error: any }> {
    try {
      // This would typically use AI-based recommendations
      // For now, we'll use simple heuristics
      
      // Get user's completed content to understand preferences
      const { data: userProgress } = await supabase
        .from('learning_progress')
        .select('content_item_id, content_items(*)')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (!userProgress?.length) {
        // New user - return popular beginner content
        return await this.getContent({
          difficulty: 'beginner',
          status: 'published',
          sort_by: 'created_at',
          sort_order: 'desc',
          limit
        });
      }

      // Extract user preferences
      const completedContent = userProgress.map(p => p.content_items).filter(Boolean);
      const preferredCategories = this.extractPreferredCategories(completedContent as ContentItem[]);
      const preferredTags = this.extractPreferredTags(completedContent as ContentItem[]);

      // Get recommendations based on preferences
      return await this.getContent({
        category: preferredCategories[0], // Primary preference
        tags: preferredTags.slice(0, 3),
        status: 'published',
        limit
      });
    } catch (error) {
      console.error('Error getting recommended content:', error);
      return { data: null, error };
    }
  }

  /**
   * Get content statistics
   */
  async getContentStats(): Promise<{ data: ContentStats | null; error: any }> {
    try {
      const cacheKey = `${this.cacheKey}_stats`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const { data: allContent, error } = await supabase
        .from('content_items')
        .select('*');

      if (error) throw error;
      if (!allContent) return { data: null, error: null };

      const totalContent = allContent.length;
      const publishedContent = allContent.filter(c => c.status === 'published').length;
      const draftContent = allContent.filter(c => c.status === 'draft').length;

      // Content by type
      const typeCount: Record<string, number> = {};
      allContent.forEach(item => {
        typeCount[item.content_type] = (typeCount[item.content_type] || 0) + 1;
      });

      const contentByType = Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Content by category
      const categoryCount: Record<string, number> = {};
      allContent.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });

      const contentByCategory = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      const stats: ContentStats = {
        total_content: totalContent,
        published_content: publishedContent,
        draft_content: draftContent,
        content_by_type: contentByType,
        content_by_category: contentByCategory,
        average_completion_rate: 0, // Would calculate from analytics
        most_popular_content: [] // Would calculate from analytics
      };

      const result = { data: stats, error: null };
      await cache.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching content stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Private helper methods
   */
  private extractPreferredCategories(content: ContentItem[]): string[] {
    const categoryCount: Record<string, number> = {};
    content.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category);
  }

  private extractPreferredTags(content: ContentItem[]): string[] {
    const tagCount: Record<string, number> = {};
    content.forEach(item => {
      item.tags?.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag);
  }

  private async invalidateContentCache(): Promise<void> {
    const patterns = [
      `${this.cacheKey}_filtered_*`,
      `${this.cacheKey}_categories`,
      `${this.cacheKey}_tags_*`,
      `${this.cacheKey}_search_*`,
      `${this.cacheKey}_stats`
    ];
    
    for (const pattern of patterns) {
      await cache.deleteByPattern(pattern);
    }
  }
}

export const contentManagementService = new ContentManagementService();
export type { 
  ContentItem, 
  CreateContentRequest, 
  ContentFilters, 
  ContentStats,
  ContentVersion 
};