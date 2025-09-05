export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'premium' | 'enterprise'
          created_at: string
          updated_at: string
          metadata: Json
          timezone: string | null
          preferences: Json
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'premium' | 'enterprise'
          created_at?: string
          updated_at?: string
          metadata?: Json
          timezone?: string | null
          preferences?: Json
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'premium' | 'enterprise'
          created_at?: string
          updated_at?: string
          metadata?: Json
          timezone?: string | null
          preferences?: Json
        }
      }
      assessments: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          questions: Json
          completed: boolean
          score: number | null
          insights: Json
          created_at: string
          completed_at: string | null
          category: string
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes: number
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          questions: Json
          completed?: boolean
          score?: number | null
          insights?: Json
          created_at?: string
          completed_at?: string | null
          category: string
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes?: number
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          questions?: Json
          completed?: boolean
          score?: number | null
          insights?: Json
          created_at?: string
          completed_at?: string | null
          category?: string
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes?: number
        }
      }
      assessment_answers: {
        Row: {
          id: string
          assessment_id: string
          question_id: string
          answer: Json
          score: number | null
          created_at: string
          response_time_seconds: number | null
        }
        Insert: {
          id?: string
          assessment_id: string
          question_id: string
          answer: Json
          score?: number | null
          created_at?: string
          response_time_seconds?: number | null
        }
        Update: {
          id?: string
          assessment_id?: string
          question_id?: string
          answer?: Json
          score?: number | null
          created_at?: string
          response_time_seconds?: number | null
        }
      }
      practices: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes: number
          instructions: Json
          created_at: string
          updated_at: string
          tags: string[]
          prerequisites: string[] | null
          learning_objectives: string[]
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes?: number
          instructions: Json
          created_at?: string
          updated_at?: string
          tags?: string[]
          prerequisites?: string[] | null
          learning_objectives?: string[]
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes?: number
          instructions?: Json
          created_at?: string
          updated_at?: string
          tags?: string[]
          prerequisites?: string[] | null
          learning_objectives?: string[]
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          target_date: string | null
          completed: boolean
          progress: number
          created_at: string
          updated_at: string
          milestones: Json
          priority: 'low' | 'medium' | 'high'
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          target_date?: string | null
          completed?: boolean
          progress?: number
          created_at?: string
          updated_at?: string
          milestones?: Json
          priority?: 'low' | 'medium' | 'high'
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          target_date?: string | null
          completed?: boolean
          progress?: number
          created_at?: string
          updated_at?: string
          milestones?: Json
          priority?: 'low' | 'medium' | 'high'
        }
      }
      progress: {
        Row: {
          id: string
          user_id: string
          practice_id: string | null
          goal_id: string | null
          assessment_id: string | null
          completed_at: string
          rating: number | null
          notes: string | null
          created_at: string
          session_duration_seconds: number | null
          mood_before: number | null
          mood_after: number | null
        }
        Insert: {
          id?: string
          user_id: string
          practice_id?: string | null
          goal_id?: string | null
          assessment_id?: string | null
          completed_at?: string
          rating?: number | null
          notes?: string | null
          created_at?: string
          session_duration_seconds?: number | null
          mood_before?: number | null
          mood_after?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          practice_id?: string | null
          goal_id?: string | null
          assessment_id?: string | null
          completed_at?: string
          rating?: number | null
          notes?: string | null
          created_at?: string
          session_duration_seconds?: number | null
          mood_before?: number | null
          mood_after?: number | null
        }
      }
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          agent_type: 'assessment_analyst' | 'learning_coach' | 'progress_tracker' | 'insight_generator' | 'communication_advisor'
          input_data: Json
          output_data: Json
          processing_time_ms: number
          token_count: number
          cost_cents: number
          cache_hit: boolean
          created_at: string
          session_id: string | null
          feedback_score: number | null
        }
        Insert: {
          id?: string
          user_id: string
          agent_type: 'assessment_analyst' | 'learning_coach' | 'progress_tracker' | 'insight_generator' | 'communication_advisor'
          input_data: Json
          output_data: Json
          processing_time_ms: number
          token_count: number
          cost_cents: number
          cache_hit?: boolean
          created_at?: string
          session_id?: string | null
          feedback_score?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          agent_type?: 'assessment_analyst' | 'learning_coach' | 'progress_tracker' | 'insight_generator' | 'communication_advisor'
          input_data?: Json
          output_data?: Json
          processing_time_ms?: number
          token_count?: number
          cost_cents?: number
          cache_hit?: boolean
          created_at?: string
          session_id?: string | null
          feedback_score?: number | null
        }
      }
      learning_paths: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          estimated_duration_weeks: number
          practices: string[]
          created_at: string
          updated_at: string
          completed: boolean
          progress_percentage: number
          category: string
          tags: string[]
          prerequisites: string[] | null
          learning_objectives: string[]
          content_items: Json
          version: number
          is_template: boolean
          template_id: string | null
          custom_order: number | null
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_duration_weeks?: number
          practices?: string[]
          created_at?: string
          updated_at?: string
          completed?: boolean
          progress_percentage?: number
          category?: string
          tags?: string[]
          prerequisites?: string[] | null
          learning_objectives?: string[]
          content_items?: Json
          version?: number
          is_template?: boolean
          template_id?: string | null
          custom_order?: number | null
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_duration_weeks?: number
          practices?: string[]
          created_at?: string
          updated_at?: string
          completed?: boolean
          progress_percentage?: number
          category?: string
          tags?: string[]
          prerequisites?: string[] | null
          learning_objectives?: string[]
          content_items?: Json
          version?: number
          is_template?: boolean
          template_id?: string | null
          custom_order?: number | null
          metadata?: Json
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'achievement' | 'reminder' | 'insight' | 'system' | 'social'
          title: string
          message: string
          read: boolean
          created_at: string
          scheduled_for: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          type: 'achievement' | 'reminder' | 'insight' | 'system' | 'social'
          title: string
          message: string
          read?: boolean
          created_at?: string
          scheduled_for?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'achievement' | 'reminder' | 'insight' | 'system' | 'social'
          title?: string
          message?: string
          read?: boolean
          created_at?: string
          scheduled_for?: string | null
          metadata?: Json
        }
      }
      content_items: {
        Row: {
          id: string
          title: string
          description: string
          content_type: 'lesson' | 'article' | 'video' | 'audio' | 'exercise' | 'quiz' | 'scenario'
          content_data: Json
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes: number
          tags: string[]
          prerequisites: string[] | null
          learning_objectives: string[]
          version: number
          status: 'draft' | 'published' | 'archived'
          created_by: string
          created_at: string
          updated_at: string
          published_at: string | null
          media_urls: Json
          interactive_elements: Json
          metadata: Json
        }
        Insert: {
          id?: string
          title: string
          description: string
          content_type: 'lesson' | 'article' | 'video' | 'audio' | 'exercise' | 'quiz' | 'scenario'
          content_data: Json
          category: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes?: number
          tags?: string[]
          prerequisites?: string[] | null
          learning_objectives?: string[]
          version?: number
          status?: 'draft' | 'published' | 'archived'
          created_by: string
          created_at?: string
          updated_at?: string
          published_at?: string | null
          media_urls?: Json
          interactive_elements?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          title?: string
          description?: string
          content_type?: 'lesson' | 'article' | 'video' | 'audio' | 'exercise' | 'quiz' | 'scenario'
          content_data?: Json
          category?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time_minutes?: number
          tags?: string[]
          prerequisites?: string[] | null
          learning_objectives?: string[]
          version?: number
          status?: 'draft' | 'published' | 'archived'
          created_by?: string
          created_at?: string
          updated_at?: string
          published_at?: string | null
          media_urls?: Json
          interactive_elements?: Json
          metadata?: Json
        }
      }
      learning_progress: {
        Row: {
          id: string
          user_id: string
          content_item_id: string
          learning_path_id: string | null
          status: 'not_started' | 'in_progress' | 'completed' | 'paused'
          progress_percentage: number
          time_spent_seconds: number
          score: number | null
          attempts: number
          last_accessed_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
          notes: string | null
          bookmarks: Json
          interaction_data: Json
        }
        Insert: {
          id?: string
          user_id: string
          content_item_id: string
          learning_path_id?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'paused'
          progress_percentage?: number
          time_spent_seconds?: number
          score?: number | null
          attempts?: number
          last_accessed_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          notes?: string | null
          bookmarks?: Json
          interaction_data?: Json
        }
        Update: {
          id?: string
          user_id?: string
          content_item_id?: string
          learning_path_id?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'paused'
          progress_percentage?: number
          time_spent_seconds?: number
          score?: number | null
          attempts?: number
          last_accessed_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          notes?: string | null
          bookmarks?: Json
          interaction_data?: Json
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          type: 'badge' | 'milestone' | 'streak' | 'mastery' | 'social'
          name: string
          description: string
          icon_url: string | null
          criteria: Json
          earned_at: string
          metadata: Json
          category: string
          points: number
          rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
        }
        Insert: {
          id?: string
          user_id: string
          type: 'badge' | 'milestone' | 'streak' | 'mastery' | 'social'
          name: string
          description: string
          icon_url?: string | null
          criteria: Json
          earned_at?: string
          metadata?: Json
          category: string
          points?: number
          rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'badge' | 'milestone' | 'streak' | 'mastery' | 'social'
          name?: string
          description?: string
          icon_url?: string | null
          criteria?: Json
          earned_at?: string
          metadata?: Json
          category?: string
          points?: number
          rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
        }
      }
      content_recommendations: {
        Row: {
          id: string
          user_id: string
          content_item_id: string
          recommendation_type: 'ai_generated' | 'similar_users' | 'trending' | 'personalized' | 'prerequisite'
          confidence_score: number
          reason: string
          metadata: Json
          created_at: string
          expires_at: string | null
          clicked: boolean
          dismissed: boolean
        }
        Insert: {
          id?: string
          user_id: string
          content_item_id: string
          recommendation_type: 'ai_generated' | 'similar_users' | 'trending' | 'personalized' | 'prerequisite'
          confidence_score: number
          reason: string
          metadata?: Json
          created_at?: string
          expires_at?: string | null
          clicked?: boolean
          dismissed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          content_item_id?: string
          recommendation_type?: 'ai_generated' | 'similar_users' | 'trending' | 'personalized' | 'prerequisite'
          confidence_score?: number
          reason?: string
          metadata?: Json
          created_at?: string
          expires_at?: string | null
          clicked?: boolean
          dismissed?: boolean
        }
      }
      content_analytics: {
        Row: {
          id: string
          content_item_id: string
          user_id: string | null
          event_type: 'view' | 'start' | 'progress' | 'complete' | 'bookmark' | 'rate' | 'share'
          event_data: Json
          session_id: string | null
          timestamp: string
          user_agent: string | null
          referrer: string | null
          device_info: Json
        }
        Insert: {
          id?: string
          content_item_id: string
          user_id?: string | null
          event_type: 'view' | 'start' | 'progress' | 'complete' | 'bookmark' | 'rate' | 'share'
          event_data?: Json
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          referrer?: string | null
          device_info?: Json
        }
        Update: {
          id?: string
          content_item_id?: string
          user_id?: string | null
          event_type?: 'view' | 'start' | 'progress' | 'complete' | 'bookmark' | 'rate' | 'share'
          event_data?: Json
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          referrer?: string | null
          device_info?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_statistics: {
        Args: {
          user_id: string
          date_from?: string
          date_to?: string
        }
        Returns: {
          total_practices: number
          current_streak: number
          longest_streak: number
          completion_rate: number
          average_rating: number
          total_session_minutes: number
          favorite_categories: Json
        }[]
      }
      get_learning_recommendations: {
        Args: {
          user_id: string
          limit?: number
        }
        Returns: {
          practice_id: string
          title: string
          reason: string
          confidence_score: number
        }[]
      }
    }
    Enums: {
      subscription_tier: 'free' | 'premium' | 'enterprise'
      difficulty_level: 'beginner' | 'intermediate' | 'advanced'
      agent_type: 'assessment_analyst' | 'learning_coach' | 'progress_tracker' | 'insight_generator' | 'communication_advisor'
      notification_type: 'achievement' | 'reminder' | 'insight' | 'system' | 'social'
      priority_level: 'low' | 'medium' | 'high'
      content_type: 'lesson' | 'article' | 'video' | 'audio' | 'exercise' | 'quiz' | 'scenario'
      content_status: 'draft' | 'published' | 'archived'
      progress_status: 'not_started' | 'in_progress' | 'completed' | 'paused'
      achievement_type: 'badge' | 'milestone' | 'streak' | 'mastery' | 'social'
      achievement_rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
      recommendation_type: 'ai_generated' | 'similar_users' | 'trending' | 'personalized' | 'prerequisite'
      analytics_event_type: 'view' | 'start' | 'progress' | 'complete' | 'bookmark' | 'rate' | 'share'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}