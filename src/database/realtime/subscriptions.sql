-- Real-time Subscriptions and Triggers for Live Data Updates
-- Enables real-time features for user engagement and notifications

-- =====================================================
-- ENABLE REAL-TIME FOR TABLES
-- =====================================================

-- Enable real-time for user-facing tables
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE user_preferences REPLICA IDENTITY FULL;
ALTER TABLE daily_practices REPLICA IDENTITY FULL;
ALTER TABLE user_achievements REPLICA IDENTITY FULL;
ALTER TABLE user_assessments REPLICA IDENTITY FULL;
ALTER TABLE user_sessions REPLICA IDENTITY FULL;
ALTER TABLE client_professional_relationships REPLICA IDENTITY FULL;

-- Add tables to the real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_practices;
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE user_assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE client_professional_relationships;

-- =====================================================
-- NOTIFICATION TRIGGERS
-- =====================================================

-- Function to send custom notifications
CREATE OR REPLACE FUNCTION notify_user_event()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSONB;
  user_id_to_notify UUID;
BEGIN
  -- Determine which user to notify
  user_id_to_notify := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Build notification payload
  notification_payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'user_id', user_id_to_notify,
    'timestamp', NOW(),
    'data', CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb
      ELSE row_to_json(NEW)::jsonb
    END
  );

  -- Send notification on specific channel
  PERFORM pg_notify(
    'user_' || user_id_to_notify::text,
    notification_payload::text
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ACHIEVEMENT TRIGGERS
-- =====================================================

-- Trigger for new achievement unlocked
CREATE OR REPLACE FUNCTION trigger_achievement_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Send achievement notification
  PERFORM pg_notify(
    'user_' || NEW.user_id::text,
    json_build_object(
      'type', 'achievement_unlocked',
      'achievement_id', NEW.id,
      'title', NEW.title,
      'description', NEW.description,
      'points', NEW.points,
      'unlocked_at', NEW.unlocked_at
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for achievements
DROP TRIGGER IF EXISTS achievement_notification_trigger ON user_achievements;
CREATE TRIGGER achievement_notification_trigger
  AFTER INSERT ON user_achievements
  FOR EACH ROW EXECUTE FUNCTION trigger_achievement_notification();

-- =====================================================
-- PRACTICE COMPLETION TRIGGERS
-- =====================================================

-- Function to handle practice completion events
CREATE OR REPLACE FUNCTION handle_practice_completion()
RETURNS TRIGGER AS $$
DECLARE
  streak_count INTEGER;
  milestone_reached BOOLEAN := FALSE;
BEGIN
  -- Only trigger on completion
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Calculate new streak
    SELECT calculate_current_streak(NEW.user_id) INTO streak_count;
    
    -- Check for streak milestones
    IF streak_count IN (3, 7, 14, 30, 60, 100) THEN
      milestone_reached := TRUE;
      
      -- Create streak achievement
      INSERT INTO user_achievements (
        user_id,
        achievement_type,
        title,
        description,
        points,
        metadata
      ) VALUES (
        NEW.user_id,
        'streak',
        streak_count || '-Day Streak!',
        'Completed daily practices for ' || streak_count || ' consecutive days',
        streak_count * 10,
        jsonb_build_object('streak_count', streak_count)
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- Send real-time notification
    PERFORM pg_notify(
      'user_' || NEW.user_id::text,
      json_build_object(
        'type', 'practice_completed',
        'practice_id', NEW.id,
        'score', NEW.score,
        'streak_count', streak_count,
        'milestone_reached', milestone_reached,
        'completed_at', NEW.completed_at
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for practice completion
DROP TRIGGER IF EXISTS practice_completion_trigger ON daily_practices;
CREATE TRIGGER practice_completion_trigger
  AFTER UPDATE ON daily_practices
  FOR EACH ROW EXECUTE FUNCTION handle_practice_completion();

-- =====================================================
-- ASSESSMENT COMPLETION TRIGGERS
-- =====================================================

-- Function to handle assessment completion
CREATE OR REPLACE FUNCTION handle_assessment_completion()
RETURNS TRIGGER AS $$
DECLARE
  improvement_percentage NUMERIC;
  previous_score NUMERIC;
BEGIN
  -- Get previous assessment score of same type
  SELECT overall_score INTO previous_score
  FROM user_assessments
  WHERE user_id = NEW.user_id
    AND assessment_type = NEW.assessment_type
    AND id != NEW.id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate improvement
  IF previous_score IS NOT NULL THEN
    improvement_percentage := ((NEW.overall_score - previous_score) / previous_score) * 100;
  END IF;

  -- Send notification with results
  PERFORM pg_notify(
    'user_' || NEW.user_id::text,
    json_build_object(
      'type', 'assessment_completed',
      'assessment_id', NEW.id,
      'assessment_type', NEW.assessment_type,
      'overall_score', NEW.overall_score,
      'previous_score', previous_score,
      'improvement_percentage', improvement_percentage,
      'completed_at', NEW.created_at
    )::text
  );

  -- Check for score-based achievements
  IF NEW.overall_score >= 90 THEN
    INSERT INTO user_achievements (
      user_id,
      achievement_type,
      title,
      description,
      points,
      metadata
    ) VALUES (
      NEW.user_id,
      'assessment',
      'Excellence in ' || INITCAP(NEW.assessment_type),
      'Scored 90+ on ' || NEW.assessment_type || ' assessment',
      100,
      jsonb_build_object('score', NEW.overall_score, 'assessment_type', NEW.assessment_type)
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assessment completion
DROP TRIGGER IF EXISTS assessment_completion_trigger ON user_assessments;
CREATE TRIGGER assessment_completion_trigger
  AFTER INSERT ON user_assessments
  FOR EACH ROW EXECUTE FUNCTION handle_assessment_completion();

-- =====================================================
-- SESSION TRACKING TRIGGERS
-- =====================================================

-- Function to update user activity tracking
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's last seen timestamp
  UPDATE users SET
    last_seen_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  -- Send activity notification to professionals if client
  PERFORM pg_notify(
    'professional_' || cpr.professional_id::text,
    json_build_object(
      'type', 'client_activity',
      'client_id', NEW.user_id,
      'session_id', NEW.id,
      'duration_minutes', NEW.duration_minutes,
      'timestamp', NEW.created_at
    )::text
  )
  FROM client_professional_relationships cpr
  WHERE cpr.client_id = NEW.user_id AND cpr.status = 'active';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session tracking
DROP TRIGGER IF EXISTS user_activity_trigger ON user_sessions;
CREATE TRIGGER user_activity_trigger
  AFTER INSERT ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION update_user_activity();

-- =====================================================
-- PROFESSIONAL-CLIENT RELATIONSHIP TRIGGERS
-- =====================================================

-- Function to handle relationship status changes
CREATE OR REPLACE FUNCTION handle_relationship_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify both parties of relationship changes
  PERFORM pg_notify(
    'user_' || NEW.client_id::text,
    json_build_object(
      'type', 'relationship_status_changed',
      'professional_id', NEW.professional_id,
      'status', NEW.status,
      'updated_at', NEW.updated_at
    )::text
  );

  PERFORM pg_notify(
    'user_' || NEW.professional_id::text,
    json_build_object(
      'type', 'client_relationship_changed',
      'client_id', NEW.client_id,
      'status', NEW.status,
      'updated_at', NEW.updated_at
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for relationship changes
DROP TRIGGER IF EXISTS relationship_change_trigger ON client_professional_relationships;
CREATE TRIGGER relationship_change_trigger
  AFTER UPDATE ON client_professional_relationships
  FOR EACH ROW EXECUTE FUNCTION handle_relationship_change();

-- =====================================================
-- SYSTEM HEALTH MONITORING TRIGGERS
-- =====================================================

-- Function to monitor system health metrics
CREATE OR REPLACE FUNCTION monitor_system_health()
RETURNS TRIGGER AS $$
DECLARE
  error_rate NUMERIC;
  current_hour TIMESTAMP;
BEGIN
  -- Only monitor AI requests for now
  IF TG_TABLE_NAME = 'ai_requests' THEN
    current_hour := date_trunc('hour', NOW());
    
    -- Calculate error rate for current hour
    SELECT 
      COALESCE(
        COUNT(*) FILTER (WHERE success = false)::NUMERIC / 
        NULLIF(COUNT(*)::NUMERIC, 0) * 100, 
        0
      ) INTO error_rate
    FROM ai_requests
    WHERE created_at >= current_hour;

    -- Send alert if error rate is high
    IF error_rate > 10 THEN
      PERFORM pg_notify(
        'system_alerts',
        json_build_object(
          'type', 'high_error_rate',
          'error_rate', error_rate,
          'hour', current_hour,
          'severity', CASE 
            WHEN error_rate > 25 THEN 'critical'
            WHEN error_rate > 15 THEN 'high'
            ELSE 'medium'
          END
        )::text
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for system health monitoring
DROP TRIGGER IF EXISTS system_health_trigger ON ai_requests;
CREATE TRIGGER system_health_trigger
  AFTER INSERT OR UPDATE ON ai_requests
  FOR EACH ROW EXECUTE FUNCTION monitor_system_health();

-- =====================================================
-- REAL-TIME ANALYTICS TRIGGERS
-- =====================================================

-- Function to update real-time analytics
CREATE OR REPLACE FUNCTION update_realtime_analytics()
RETURNS TRIGGER AS $$
DECLARE
  analytics_data JSONB;
BEGIN
  -- Build analytics update based on table
  CASE TG_TABLE_NAME
    WHEN 'user_sessions' THEN
      analytics_data := jsonb_build_object(
        'type', 'session_update',
        'active_users', (
          SELECT COUNT(DISTINCT user_id)
          FROM user_sessions
          WHERE created_at >= NOW() - INTERVAL '15 minutes'
        ),
        'sessions_last_hour', (
          SELECT COUNT(*)
          FROM user_sessions
          WHERE created_at >= NOW() - INTERVAL '1 hour'
        )
      );
    
    WHEN 'daily_practices' THEN
      IF NEW.status = 'completed' THEN
        analytics_data := jsonb_build_object(
          'type', 'practices_update',
          'practices_completed_today', (
            SELECT COUNT(*)
            FROM daily_practices
            WHERE completed_at::date = CURRENT_DATE
              AND status = 'completed'
          )
        );
      END IF;
    
    WHEN 'ai_requests' THEN
      analytics_data := jsonb_build_object(
        'type', 'ai_usage_update',
        'ai_requests_last_hour', (
          SELECT COUNT(*)
          FROM ai_requests
          WHERE created_at >= NOW() - INTERVAL '1 hour'
        ),
        'avg_response_time_ms', (
          SELECT COALESCE(AVG(response_time_ms), 0)
          FROM ai_requests
          WHERE created_at >= NOW() - INTERVAL '1 hour'
        )
      );
  END CASE;

  -- Send analytics update
  IF analytics_data IS NOT NULL THEN
    PERFORM pg_notify('realtime_analytics', analytics_data::text);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time analytics
DROP TRIGGER IF EXISTS analytics_session_trigger ON user_sessions;
CREATE TRIGGER analytics_session_trigger
  AFTER INSERT ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION update_realtime_analytics();

DROP TRIGGER IF EXISTS analytics_practice_trigger ON daily_practices;
CREATE TRIGGER analytics_practice_trigger
  AFTER UPDATE ON daily_practices
  FOR EACH ROW EXECUTE FUNCTION update_realtime_analytics();

DROP TRIGGER IF EXISTS analytics_ai_trigger ON ai_requests;
CREATE TRIGGER analytics_ai_trigger
  AFTER INSERT ON ai_requests
  FOR EACH ROW EXECUTE FUNCTION update_realtime_analytics();

-- =====================================================
-- SCHEDULED FUNCTIONS FOR PERIODIC UPDATES
-- =====================================================

-- Function to send daily summary notifications
CREATE OR REPLACE FUNCTION send_daily_summaries()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  summary_data JSONB;
BEGIN
  -- Loop through active users from last 7 days
  FOR user_record IN 
    SELECT DISTINCT u.id, u.email, u.full_name
    FROM users u
    JOIN user_sessions s ON u.id = s.user_id
    WHERE s.created_at >= NOW() - INTERVAL '7 days'
      AND u.email IS NOT NULL
  LOOP
    -- Get user engagement metrics
    SELECT get_user_engagement_metrics(user_record.id, 1) INTO summary_data;
    
    -- Send daily summary notification
    PERFORM pg_notify(
      'user_' || user_record.id::text,
      json_build_object(
        'type', 'daily_summary',
        'user_id', user_record.id,
        'summary', summary_data,
        'generated_at', NOW()
      )::text
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_daily_summaries() TO service_role;

-- Function to check for inactive users and send re-engagement notifications
CREATE OR REPLACE FUNCTION check_inactive_users()
RETURNS VOID AS $$
DECLARE
  inactive_user RECORD;
BEGIN
  -- Find users who haven't been active in 3 days but were active in last 2 weeks
  FOR inactive_user IN
    SELECT u.id, u.email, u.full_name, MAX(s.created_at) as last_activity
    FROM users u
    LEFT JOIN user_sessions s ON u.id = s.user_id
    WHERE u.created_at >= NOW() - INTERVAL '2 weeks' -- Joined in last 2 weeks
    GROUP BY u.id, u.email, u.full_name
    HAVING MAX(s.created_at) < NOW() - INTERVAL '3 days' -- Inactive for 3+ days
      OR MAX(s.created_at) IS NULL
  LOOP
    -- Send re-engagement notification
    PERFORM pg_notify(
      'user_' || inactive_user.id::text,
      json_build_object(
        'type', 'reengagement_reminder',
        'user_id', inactive_user.id,
        'last_activity', inactive_user.last_activity,
        'message', 'We miss you! Come back and continue your relationship growth journey.',
        'suggested_action', 'Complete a quick daily practice or take an assessment'
      )::text
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_inactive_users() TO service_role;

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to cleanup old notifications and sessions
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
  -- Delete old user sessions (keep 30 days)
  DELETE FROM user_sessions
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete old AI request logs (keep 7 days for non-critical, 30 days for errors)
  DELETE FROM ai_requests
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND success = true;
  
  DELETE FROM ai_requests
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete old audit logs (keep 90 days)
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND action NOT IN ('LOGIN', 'LOGOUT', 'PAYMENT', 'SUBSCRIPTION_CHANGE');

  -- Clean up expired user sessions
  UPDATE users SET 
    last_seen_at = NOW() - INTERVAL '1 day'
  WHERE last_seen_at < NOW() - INTERVAL '30 days';

END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO service_role;

-- =====================================================
-- REAL-TIME SUBSCRIPTION MANAGEMENT
-- =====================================================

-- Function to manage user's real-time subscription channels
CREATE OR REPLACE FUNCTION get_user_channels(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
  channels TEXT[] := ARRAY[]::TEXT[];
  is_professional BOOLEAN := FALSE;
BEGIN
  -- Base user channel
  channels := array_append(channels, 'user_' || user_uuid::text);
  
  -- Check if user is a professional
  SELECT EXISTS(SELECT 1 FROM professionals WHERE id = user_uuid) INTO is_professional;
  
  IF is_professional THEN
    -- Add professional channels
    channels := array_append(channels, 'professional_' || user_uuid::text);
  END IF;
  
  -- Add system channels based on subscription tier
  IF get_user_subscription_tier(user_uuid) IN ('premium', 'professional') THEN
    channels := array_append(channels, 'premium_updates');
  END IF;

  RETURN channels;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_channels(UUID) TO authenticated;
