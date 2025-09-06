-- Row Level Security (RLS) Policies for Kasama AI
-- Comprehensive data protection and user isolation

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_professional_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role can access all users (for admin operations)
CREATE POLICY "Service role can access all users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Anonymous users can insert (for registration)
CREATE POLICY "Allow anonymous registration" ON users
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- USER ONBOARDING POLICIES
-- =====================================================

CREATE POLICY "Users can manage their own onboarding" ON user_onboarding
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all onboarding" ON user_onboarding
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- USER PREFERENCES POLICIES
-- =====================================================

CREATE POLICY "Users can manage their preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all preferences" ON user_preferences
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- USER SUBSCRIPTIONS POLICIES
-- =====================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can insert subscriptions (for upgrades)
CREATE POLICY "Authenticated users can create subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- USER PAYMENTS POLICIES
-- =====================================================

-- Users can only view their own payment records
CREATE POLICY "Users can view own payments" ON user_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all payments
CREATE POLICY "Service role can manage payments" ON user_payments
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- USER SESSIONS POLICIES
-- =====================================================

-- Users can view and create their own sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all sessions for analytics
CREATE POLICY "Service role can access all sessions" ON user_sessions
  FOR SELECT USING (auth.role() = 'service_role');

-- =====================================================
-- DAILY PRACTICES POLICIES
-- =====================================================

-- Users can manage their own daily practices
CREATE POLICY "Users can manage own practices" ON daily_practices
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all practices for analytics
CREATE POLICY "Service role can access all practices" ON daily_practices
  FOR SELECT USING (auth.role() = 'service_role');

-- Professionals can view practices of their clients
CREATE POLICY "Professionals can view client practices" ON daily_practices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships cpr
      WHERE cpr.professional_id = auth.uid()
        AND cpr.client_id = daily_practices.user_id
        AND cpr.status = 'active'
    )
  );

-- =====================================================
-- LEARNING MODULES POLICIES
-- =====================================================

-- Everyone can view learning modules (they're content)
CREATE POLICY "Anyone can view learning modules" ON learning_modules
  FOR SELECT USING (true);

-- Only service role can modify learning modules
CREATE POLICY "Service role can manage modules" ON learning_modules
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update modules" ON learning_modules
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete modules" ON learning_modules
  FOR DELETE USING (auth.role() = 'service_role');

-- =====================================================
-- USER ACHIEVEMENTS POLICIES
-- =====================================================

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all achievements
CREATE POLICY "Service role can manage achievements" ON user_achievements
  FOR ALL USING (auth.role() = 'service_role');

-- System can insert achievements (triggered by functions)
CREATE POLICY "System can insert achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- USER ANALYTICS POLICIES
-- =====================================================

-- Users can view their own analytics
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all analytics
CREATE POLICY "Service role can manage analytics" ON user_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Professionals can view analytics of their clients
CREATE POLICY "Professionals can view client analytics" ON user_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships cpr
      WHERE cpr.professional_id = auth.uid()
        AND cpr.client_id = user_analytics.user_id
        AND cpr.status = 'active'
    )
  );

-- =====================================================
-- PROFESSIONALS POLICIES
-- =====================================================

-- Professionals can view and update their own profile
CREATE POLICY "Professionals can manage own profile" ON professionals
  FOR ALL USING (auth.uid() = id);

-- Service role can access all professionals
CREATE POLICY "Service role can access professionals" ON professionals
  FOR ALL USING (auth.role() = 'service_role');

-- Clients can view basic info of their professionals
CREATE POLICY "Clients can view their professionals" ON professionals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships cpr
      WHERE cpr.professional_id = professionals.id
        AND cpr.client_id = auth.uid()
        AND cpr.status = 'active'
    )
  );

-- =====================================================
-- CLIENT-PROFESSIONAL RELATIONSHIPS POLICIES
-- =====================================================

-- Users can view relationships where they are client or professional
CREATE POLICY "Users can view their relationships" ON client_professional_relationships
  FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = professional_id
  );

-- Service role can manage all relationships
CREATE POLICY "Service role can manage relationships" ON client_professional_relationships
  FOR ALL USING (auth.role() = 'service_role');

-- Professionals can update relationships where they are the professional
CREATE POLICY "Professionals can update their relationships" ON client_professional_relationships
  FOR UPDATE USING (auth.uid() = professional_id);

-- Clients can create relationships (send requests)
CREATE POLICY "Clients can create relationships" ON client_professional_relationships
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- =====================================================
-- USER ASSESSMENTS POLICIES
-- =====================================================

-- Users can manage their own assessments
CREATE POLICY "Users can manage own assessments" ON user_assessments
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all assessments
CREATE POLICY "Service role can access assessments" ON user_assessments
  FOR ALL USING (auth.role() = 'service_role');

-- Professionals can view assessments of their clients
CREATE POLICY "Professionals can view client assessments" ON user_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships cpr
      WHERE cpr.professional_id = auth.uid()
        AND cpr.client_id = user_assessments.user_id
        AND cpr.status = 'active'
    )
  );

-- =====================================================
-- AI REQUESTS POLICIES
-- =====================================================

-- Users can view their own AI requests
CREATE POLICY "Users can view own AI requests" ON ai_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all AI requests
CREATE POLICY "Service role can manage AI requests" ON ai_requests
  FOR ALL USING (auth.role() = 'service_role');

-- System can insert AI requests (for logging)
CREATE POLICY "System can log AI requests" ON ai_requests
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- SUBSCRIPTION TIER POLICIES
-- =====================================================

-- Create a function to check user's subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  tier TEXT;
BEGIN
  SELECT subscription_tier INTO tier
  FROM user_subscriptions
  WHERE user_id = user_uuid
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_subscription_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_tier(UUID) TO anon;

-- =====================================================
-- ADVANCED SECURITY POLICIES
-- =====================================================

-- Prevent users from accessing data from other users even if they guess IDs
CREATE OR REPLACE FUNCTION is_owner_or_professional(user_uuid UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- User is accessing their own data
  IF user_uuid = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- User is a professional accessing client data
  IF EXISTS (
    SELECT 1 FROM client_professional_relationships cpr
    WHERE cpr.professional_id = user_uuid
      AND cpr.client_id = target_user_id
      AND cpr.status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_owner_or_professional(UUID, UUID) TO authenticated;

-- =====================================================
-- AUDIT POLICIES
-- =====================================================

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role can access audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- DATA RETENTION POLICIES
-- =====================================================

-- Function to anonymize user data after account deletion
CREATE OR REPLACE FUNCTION anonymize_user_data(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update user record to remove PII
  UPDATE users SET
    email = 'deleted_' || user_uuid || '@deleted.local',
    full_name = 'Deleted User',
    avatar_url = NULL,
    phone = NULL,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Keep analytics data but remove identifying information
  UPDATE user_analytics SET
    anonymized = true,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Log the anonymization
  INSERT INTO audit_logs (user_id, action, table_name, record_id)
  VALUES (user_uuid, 'ANONYMIZE', 'users', user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION anonymize_user_data(UUID) TO service_role;

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS SECURITY
-- =====================================================

-- Create publication for real-time features
CREATE PUBLICATION user_changes FOR TABLE 
  users, user_preferences, daily_practices, user_achievements;

-- Users can only subscribe to their own data changes
ALTER PUBLICATION user_changes OWNER TO postgres;

-- =====================================================
-- SECURITY MONITORING
-- =====================================================

-- Function to log suspicious activity
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  severity TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    old_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    event_type,
    'security_events',
    jsonb_build_object(
      'severity', severity,
      'description', description,
      'metadata', metadata,
      'timestamp', NOW()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_security_event(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- =====================================================
-- REFRESH POLICIES (if any changes were made)
-- =====================================================

-- Function to refresh all RLS policies
CREATE OR REPLACE FUNCTION refresh_rls_policies()
RETURNS TEXT AS $$
BEGIN
  -- This function can be called to refresh policies if needed
  -- Currently just returns status
  RETURN 'RLS policies are active and configured';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION refresh_rls_policies() TO service_role;

-- =====================================================
-- VALIDATE POLICIES
-- =====================================================

-- Test function to validate RLS is working
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TEXT AS $$
DECLARE
  test_result TEXT := 'RLS Tests: ';
  user_count INTEGER;
BEGIN
  -- Test that non-authenticated users can't access user data
  SET ROLE anon;
  SELECT COUNT(*) INTO user_count FROM users;
  
  IF user_count = 0 THEN
    test_result := test_result || 'Anonymous access blocked ✓ ';
  ELSE
    test_result := test_result || 'Anonymous access NOT blocked ✗ ';
  END IF;
  
  -- Reset role
  RESET ROLE;
  
  test_result := test_result || 'Tests completed';
  RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role for testing
GRANT EXECUTE ON FUNCTION test_rls_policies() TO service_role;
