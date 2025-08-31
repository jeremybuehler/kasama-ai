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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}