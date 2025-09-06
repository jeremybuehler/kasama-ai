-- Kasama AI Enhanced Database Schema - Production Features
-- This migration adds business model, onboarding, and advanced features

-- Create additional enums for enhanced functionality
CREATE TYPE onboarding_step_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'canceled');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'unpaid', 'trialing');

-- User onboarding tracking table
CREATE TABLE user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 1,
  completed_steps JSONB DEFAULT '[]',
  business_type TEXT,
  business_name TEXT,
  business_address TEXT,
  business_phone TEXT,
  primary_goals JSONB DEFAULT '[]',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onboarding_data JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT valid_step CHECK (current_step >= 1 AND current_step <= 10),
  CONSTRAINT completed_logic CHECK (
    (completed_at IS NULL) OR 
    (completed_at IS NOT NULL AND current_step > 5)
  )
);

-- User preferences enhanced table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sms": false,
    "marketing": false,
    "insights": true,
    "reminders": true
  }',
  platform_preferences JSONB DEFAULT '{
    "theme": "system",
    "language": "en",
    "timezone": "UTC",
    "accessibility": {}
  }',
  feature_flags JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{
    "data_sharing": false,
    "analytics": true,
    "personalization": true,
    "third_party": false
  }',
  ai_preferences JSONB DEFAULT '{
    "communication_style": "supportive",
    "personality": "encouraging",
    "frequency": "daily",
    "insights_depth": "detailed"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription management
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status subscription_status DEFAULT 'trialing',
  tier subscription_tier DEFAULT 'free',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT one_active_subscription_per_user UNIQUE (user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Payment history
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT DEFAULT 'usd' CHECK (length(currency) = 3),
  status payment_status DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Daily practices enhanced table (extending existing practices)
CREATE TABLE daily_practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_notes TEXT,
  session_duration_seconds INTEGER,
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint per user per day per practice
  UNIQUE(user_id, practice_id, scheduled_date)
);

-- Learning modules (enhanced learning paths)
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL,
  duration_minutes INTEGER DEFAULT 15,
  difficulty difficulty_level DEFAULT 'beginner',
  prerequisites UUID[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT FALSE,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || description || ' ' || array_to_string(tags, ' '))
  ) STORED
);

-- User module progress
CREATE TABLE user_module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  quiz_scores JSONB DEFAULT '[]',
  bookmarks JSONB DEFAULT '[]',
  notes TEXT,
  
  -- One progress record per user per module
  UNIQUE(user_id, module_id)
);

-- Achievement system
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT NOT NULL,
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  requirements JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- User achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- One achievement per user
  UNIQUE(user_id, achievement_id)
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}',
  user_properties JSONB DEFAULT '{}',
  session_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT
) PARTITION BY RANGE (timestamp);

-- Create analytics partitions (monthly)
CREATE TABLE analytics_events_2025_01 PARTITION OF analytics_events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE analytics_events_2025_02 PARTITION OF analytics_events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE analytics_events_2025_03 PARTITION OF analytics_events
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Professional platform tables (B2B2C)
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  specializations TEXT[] DEFAULT '{}',
  years_experience INTEGER CHECK (years_experience >= 0),
  bio TEXT,
  hourly_rate_cents INTEGER CHECK (hourly_rate_cents >= 0),
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Client-professional relationships
CREATE TABLE client_professional_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'ended')),
  consent_granted BOOLEAN DEFAULT FALSE,
  consent_granted_at TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One active relationship per client-professional pair
  UNIQUE(client_id, professional_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX idx_user_onboarding_current_step ON user_onboarding(current_step);
CREATE INDEX idx_user_onboarding_completed ON user_onboarding(completed_at) WHERE completed_at IS NOT NULL;

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_daily_practices_user_id ON daily_practices(user_id);
CREATE INDEX idx_daily_practices_scheduled_date ON daily_practices(scheduled_date);
CREATE INDEX idx_daily_practices_user_date ON daily_practices(user_id, scheduled_date);

CREATE INDEX idx_learning_modules_category ON learning_modules(category);
CREATE INDEX idx_learning_modules_difficulty ON learning_modules(difficulty);
CREATE INDEX idx_learning_modules_search ON learning_modules USING gin(search_vector);
CREATE INDEX idx_learning_modules_published ON learning_modules(published) WHERE published = true;

CREATE INDEX idx_user_module_progress_user_id ON user_module_progress(user_id);
CREATE INDEX idx_user_module_progress_module_id ON user_module_progress(module_id);
CREATE INDEX idx_user_module_progress_completed ON user_module_progress(completed_at) WHERE completed_at IS NOT NULL;

CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(active) WHERE active = true;

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_professionals_verified ON professionals(verified) WHERE verified = true;
CREATE INDEX idx_professionals_active ON professionals(active) WHERE active = true;

CREATE INDEX idx_client_professional_status ON client_professional_relationships(status);
CREATE INDEX idx_client_professional_client ON client_professional_relationships(client_id);
CREATE INDEX idx_client_professional_professional ON client_professional_relationships(professional_id);

-- Row Level Security policies for new tables
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_professional_relationships ENABLE ROW LEVEL SECURITY;

-- User onboarding policies
CREATE POLICY "Users can manage own onboarding" ON user_onboarding FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Payment policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage payments" ON payments FOR ALL USING (auth.role() = 'service_role');

-- Daily practices policies
CREATE POLICY "Users can manage own daily practices" ON daily_practices FOR ALL USING (auth.uid() = user_id);

-- Learning modules policies (public read for authenticated users)
CREATE POLICY "Authenticated users can view published modules" ON learning_modules FOR SELECT TO authenticated 
  USING (published = true);
CREATE POLICY "Admins can manage modules" ON learning_modules FOR ALL USING (auth.role() = 'service_role');

-- User module progress policies
CREATE POLICY "Users can manage own module progress" ON user_module_progress FOR ALL USING (auth.uid() = user_id);

-- Achievement policies (public read)
CREATE POLICY "Authenticated users can view active achievements" ON achievements FOR SELECT TO authenticated 
  USING (active = true);

-- User achievement policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can grant achievements" ON user_achievements FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert analytics" ON analytics_events FOR INSERT WITH CHECK (true);

-- Professional policies
CREATE POLICY "Users can view own professional profile" ON professionals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own professional profile" ON professionals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view verified professionals" ON professionals FOR SELECT TO authenticated
  USING (verified = true AND active = true);

-- Client-professional relationship policies
CREATE POLICY "Clients can view own relationships" ON client_professional_relationships FOR SELECT 
  USING (auth.uid() = client_id);
CREATE POLICY "Professionals can view own relationships" ON client_professional_relationships FOR SELECT 
  USING (EXISTS (SELECT 1 FROM professionals WHERE professionals.user_id = auth.uid() AND professionals.id = professional_id));
CREATE POLICY "Users can manage relationships they're part of" ON client_professional_relationships FOR ALL 
  USING (auth.uid() = client_id OR EXISTS (SELECT 1 FROM professionals WHERE professionals.user_id = auth.uid() AND professionals.id = professional_id));

-- Trigger functions for updated_at
CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON user_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_modules_updated_at BEFORE UPDATE ON learning_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_professional_relationships_updated_at BEFORE UPDATE ON client_professional_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for partition management
CREATE OR REPLACE FUNCTION create_monthly_analytics_partition(partition_date date)
RETURNS void AS $$
DECLARE
  partition_name text;
  start_date text;
  end_date text;
BEGIN
  partition_name := 'analytics_events_' || to_char(partition_date, 'YYYY_MM');
  start_date := to_char(date_trunc('month', partition_date), 'YYYY-MM-DD');
  end_date := to_char(date_trunc('month', partition_date) + interval '1 month', 'YYYY-MM-DD');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF analytics_events FOR VALUES FROM (%L) TO (%L)',
                 partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Insert some default achievements
INSERT INTO achievements (name, description, category, points, rarity, requirements) VALUES
('First Steps', 'Complete your first assessment', 'assessment', 10, 'common', '{"assessments_completed": 1}'),
('Getting Started', 'Complete the onboarding process', 'onboarding', 25, 'common', '{"onboarding_completed": true}'),
('Daily Habit', 'Complete 7 daily practices', 'practice', 50, 'uncommon', '{"daily_practices_completed": 7}'),
('Streak Master', 'Maintain a 30-day practice streak', 'practice', 100, 'rare', '{"practice_streak_days": 30}'),
('Knowledge Seeker', 'Complete 5 learning modules', 'learning', 75, 'uncommon', '{"modules_completed": 5}'),
('Relationship Expert', 'Achieve 90%+ on relationship assessment', 'assessment', 150, 'epic', '{"assessment_score": 90}'),
('AI Collaborator', 'Have 100 AI interactions', 'ai', 200, 'epic', '{"ai_interactions": 100}'),
('Community Builder', 'Help 10 other users', 'community', 300, 'legendary', '{"users_helped": 10}');

-- Insert some default learning modules
INSERT INTO learning_modules (title, description, content, duration_minutes, difficulty, category, tags, published) VALUES
('Introduction to Emotional Intelligence', 'Learn the basics of emotional intelligence and self-awareness', 
 '{"sections": [{"title": "What is EI?", "content": "..."}, {"title": "Components of EI", "content": "..."}]}', 
 20, 'beginner', 'emotional_intelligence', '{"emotional intelligence", "self-awareness", "basics"}', true),

('Effective Communication Skills', 'Master the art of clear and empathetic communication',
 '{"sections": [{"title": "Active Listening", "content": "..."}, {"title": "Nonverbal Communication", "content": "..."}]}',
 30, 'intermediate', 'communication', '{"communication", "listening", "empathy"}', true),

('Conflict Resolution Strategies', 'Learn to navigate and resolve conflicts constructively',
 '{"sections": [{"title": "Understanding Conflict", "content": "..."}, {"title": "Resolution Techniques", "content": "..."}]}',
 25, 'intermediate', 'conflict_resolution', '{"conflict", "resolution", "negotiation"}', true),

('Building Trust in Relationships', 'Develop strategies for building and maintaining trust',
 '{"sections": [{"title": "Foundations of Trust", "content": "..."}, {"title": "Rebuilding Trust", "content": "..."}]}',
 35, 'advanced', 'trust', '{"trust", "relationships", "healing"}', true);

-- Insert some default practices
INSERT INTO practices (title, description, category, difficulty, estimated_time_minutes, instructions, tags, learning_objectives) VALUES
('Daily Gratitude Practice', 'Reflect on three things you are grateful for today', 'mindfulness', 'beginner', 5,
 '{"steps": ["Find a quiet space", "Think of 3 specific things you are grateful for", "Write them down or say them aloud", "Reflect on why each matters to you"]}',
 '{"gratitude", "mindfulness", "daily"}', 
 '{"Cultivate positive mindset", "Increase awareness of good in life", "Build daily reflection habit"}'),

('Active Listening Exercise', 'Practice focused listening with a partner or during conversations', 'communication', 'intermediate', 10,
 '{"steps": ["Choose a conversation partner", "Listen without interrupting", "Reflect back what you heard", "Ask clarifying questions", "Avoid giving advice unless asked"]}',
 '{"listening", "communication", "empathy"}',
 '{"Improve listening skills", "Enhance empathy", "Strengthen relationships"}'),

('Emotional Check-in', 'Regular self-assessment of emotional state and needs', 'self_awareness', 'beginner', 7,
 '{"steps": ["Pause and breathe deeply", "Ask: How am I feeling right now?", "Name the specific emotion", "Ask: What do I need right now?", "Take one small action to meet that need"]}',
 '{"emotions", "self-awareness", "check-in"}',
 '{"Increase emotional awareness", "Practice self-care", "Build emotional vocabulary"}'),

('Conflict De-escalation', 'Techniques for calming tense situations', 'conflict_resolution', 'advanced', 15,
 '{"steps": ["Recognize escalation signs", "Use calm, low tone of voice", "Acknowledge the other persons feelings", "Find common ground", "Suggest a break if needed"]}',
 '{"conflict", "de-escalation", "communication"}',
 '{"Manage conflict effectively", "Maintain relationships under stress", "Practice emotional regulation"});

COMMENT ON TABLE user_onboarding IS 'Tracks user onboarding progress and collected information';
COMMENT ON TABLE user_preferences IS 'User preferences for notifications, platform settings, and AI interactions';
COMMENT ON TABLE subscriptions IS 'Subscription management with Stripe integration';
COMMENT ON TABLE payments IS 'Payment history and transaction records';
COMMENT ON TABLE daily_practices IS 'Daily practice scheduling and completion tracking';
COMMENT ON TABLE learning_modules IS 'Educational content modules for skill building';
COMMENT ON TABLE user_module_progress IS 'User progress through learning modules';
COMMENT ON TABLE achievements IS 'Achievement definitions and requirements';
COMMENT ON TABLE user_achievements IS 'User-earned achievements';
COMMENT ON TABLE analytics_events IS 'User behavior and platform analytics';
COMMENT ON TABLE professionals IS 'Professional user profiles for B2B2C features';
COMMENT ON TABLE client_professional_relationships IS 'Client-professional relationship management';
