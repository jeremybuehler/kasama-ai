-- Kasama AI Database Schema - Production Ready
-- This migration creates the optimized database schema for the 5-agent AI system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE agent_type AS ENUM (
  'assessment_analyst',
  'learning_coach', 
  'progress_tracker',
  'insight_generator',
  'communication_advisor'
);
CREATE TYPE notification_type AS ENUM ('achievement', 'reminder', 'insight', 'system', 'social');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- Enhanced profiles table with optimization
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier DEFAULT 'free'::subscription_tier,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  
  -- Performance optimization
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Assessments table with partitioning for scale
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score NUMERIC(5,2),
  insights JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  category TEXT NOT NULL,
  difficulty_level difficulty_level DEFAULT 'beginner'::difficulty_level,
  estimated_time_minutes INTEGER DEFAULT 15,
  
  -- Constraints
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT completed_at_logic CHECK (
    (completed = FALSE AND completed_at IS NULL) OR 
    (completed = TRUE AND completed_at IS NOT NULL)
  )
) PARTITION BY RANGE (created_at);

-- Create partitions for assessments (monthly)
CREATE TABLE assessments_2025_01 PARTITION OF assessments
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE assessments_2025_02 PARTITION OF assessments
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE assessments_2025_03 PARTITION OF assessments
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Assessment answers with optimized storage
CREATE TABLE assessment_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  answer JSONB NOT NULL,
  score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_time_seconds INTEGER,
  
  -- Foreign key to partitioned table
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  
  -- Unique constraint per assessment/question
  UNIQUE(assessment_id, question_id)
);

-- Practices table with rich metadata
CREATE TABLE practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty difficulty_level DEFAULT 'beginner'::difficulty_level,
  estimated_time_minutes INTEGER DEFAULT 5,
  instructions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  prerequisites UUID[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || description || ' ' || array_to_string(tags, ' '))
  ) STORED
);

-- Goals table with milestone tracking
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  progress NUMERIC(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  milestones JSONB DEFAULT '[]',
  priority priority_level DEFAULT 'medium'::priority_level
);

-- Progress tracking with rich analytics data
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  assessment_id UUID,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration_seconds INTEGER,
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  
  -- At least one activity reference must be provided
  CONSTRAINT has_activity CHECK (
    practice_id IS NOT NULL OR 
    goal_id IS NOT NULL OR 
    assessment_id IS NOT NULL
  )
);

-- AI interactions table for performance tracking and cost optimization
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  agent_type agent_type NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  cost_cents NUMERIC(10,4) NOT NULL DEFAULT 0,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID,
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5)
) PARTITION BY RANGE (created_at);

-- Create partitions for AI interactions (weekly for better performance)
CREATE TABLE ai_interactions_2025_w01 PARTITION OF ai_interactions
  FOR VALUES FROM ('2025-01-01') TO ('2025-01-08');
CREATE TABLE ai_interactions_2025_w02 PARTITION OF ai_interactions
  FOR VALUES FROM ('2025-01-08') TO ('2025-01-15');
CREATE TABLE ai_interactions_2025_w03 PARTITION OF ai_interactions
  FOR VALUES FROM ('2025-01-15') TO ('2025-01-22');

-- Learning paths for personalized curriculum
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty difficulty_level DEFAULT 'beginner'::difficulty_level,
  estimated_duration_weeks INTEGER DEFAULT 4,
  practices UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Notifications system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Performance indexes for optimal query performance
-- User-centric indexes
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_email_trgm ON profiles USING gin (email gin_trgm_ops);

-- Assessment performance indexes
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_user_completed ON assessments(user_id, completed);
CREATE INDEX idx_assessments_type_created ON assessments(type, created_at DESC);
CREATE INDEX idx_assessments_category ON assessments(category);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at) WHERE completed_at IS NOT NULL;

-- Assessment answers optimization
CREATE INDEX idx_assessment_answers_assessment_id ON assessment_answers(assessment_id);
CREATE INDEX idx_assessment_answers_question_id ON assessment_answers(question_id);

-- Practice search and filtering
CREATE INDEX idx_practices_category ON practices(category);
CREATE INDEX idx_practices_difficulty ON practices(difficulty);
CREATE INDEX idx_practices_search ON practices USING gin(search_vector);
CREATE INDEX idx_practices_tags ON practices USING gin(tags);

-- Goals tracking
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_user_completed ON goals(user_id, completed);
CREATE INDEX idx_goals_target_date ON goals(target_date) WHERE target_date IS NOT NULL;
CREATE INDEX idx_goals_priority ON goals(priority);

-- Progress analytics optimization
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_user_completed ON progress(user_id, completed_at DESC);
CREATE INDEX idx_progress_practice_id ON progress(practice_id) WHERE practice_id IS NOT NULL;
CREATE INDEX idx_progress_goal_id ON progress(goal_id) WHERE goal_id IS NOT NULL;
CREATE INDEX idx_progress_created_at ON progress(created_at);

-- AI interaction analytics
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_agent_type ON ai_interactions(agent_type);
CREATE INDEX idx_ai_interactions_user_agent ON ai_interactions(user_id, agent_type);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);
CREATE INDEX idx_ai_interactions_cost ON ai_interactions(cost_cents);
CREATE INDEX idx_ai_interactions_cache ON ai_interactions(cache_hit, created_at);
CREATE INDEX idx_ai_interactions_session ON ai_interactions(session_id) WHERE session_id IS NOT NULL;

-- Learning paths
CREATE INDEX idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX idx_learning_paths_difficulty ON learning_paths(difficulty);
CREATE INDEX idx_learning_paths_completed ON learning_paths(completed);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Composite indexes for complex queries
CREATE INDEX idx_assessments_user_type_completed ON assessments(user_id, type, completed, created_at DESC);
CREATE INDEX idx_progress_user_practice_date ON progress(user_id, practice_id, completed_at DESC) WHERE practice_id IS NOT NULL;
CREATE INDEX idx_ai_interactions_user_cost_date ON ai_interactions(user_id, cost_cents, created_at);

-- Full-text search index for global search
CREATE INDEX idx_practices_full_search ON practices USING gin(
  (setweight(to_tsvector('english', title), 'A') ||
   setweight(to_tsvector('english', description), 'B') ||
   setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C'))
);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Assessments policies
CREATE POLICY "Users can view own assessments" ON assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON assessments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assessments" ON assessments FOR DELETE USING (auth.uid() = user_id);

-- Assessment answers policies
CREATE POLICY "Users can view own assessment answers" ON assessment_answers FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM assessments 
    WHERE assessments.id = assessment_answers.assessment_id 
    AND assessments.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own assessment answers" ON assessment_answers FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM assessments 
    WHERE assessments.id = assessment_answers.assessment_id 
    AND assessments.user_id = auth.uid()
  ));

-- Goals policies
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);

-- Progress policies
CREATE POLICY "Users can manage own progress" ON progress FOR ALL USING (auth.uid() = user_id);

-- AI interactions policies
CREATE POLICY "Users can view own AI interactions" ON ai_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert AI interactions" ON ai_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning paths policies
CREATE POLICY "Users can manage own learning paths" ON learning_paths FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Practices are public (read-only for users)
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view practices" ON practices FOR SELECT TO authenticated USING (true);

-- Trigger functions for automated maintenance
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create new partitions
CREATE OR REPLACE FUNCTION create_monthly_assessment_partition(partition_date date)
RETURNS void AS $$
DECLARE
  partition_name text;
  start_date text;
  end_date text;
BEGIN
  partition_name := 'assessments_' || to_char(partition_date, 'YYYY_MM');
  start_date := to_char(date_trunc('month', partition_date), 'YYYY-MM-DD');
  end_date := to_char(date_trunc('month', partition_date) + interval '1 month', 'YYYY-MM-DD');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF assessments FOR VALUES FROM (%L) TO (%L)',
                 partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create AI interaction partitions (weekly)
CREATE OR REPLACE FUNCTION create_weekly_ai_partition(partition_date date)
RETURNS void AS $$
DECLARE
  partition_name text;
  start_date text;
  end_date text;
  week_num text;
BEGIN
  week_num := to_char(partition_date, 'YYYY_"w"WW');
  partition_name := 'ai_interactions_' || week_num;
  start_date := to_char(date_trunc('week', partition_date), 'YYYY-MM-DD');
  end_date := to_char(date_trunc('week', partition_date) + interval '1 week', 'YYYY-MM-DD');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF ai_interactions FOR VALUES FROM (%L) TO (%L)',
                 partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;