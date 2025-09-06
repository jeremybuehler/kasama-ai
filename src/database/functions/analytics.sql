-- Advanced Analytics Functions for Kasama AI
-- These functions provide comprehensive analytics and reporting capabilities

-- =====================================================
-- USER ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get user engagement metrics
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(
  user_uuid UUID,
  period_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_date TIMESTAMP;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * period_days;
  
  SELECT json_build_object(
    'user_id', user_uuid,
    'period_days', period_days,
    'total_sessions', COUNT(DISTINCT s.id),
    'total_session_time_minutes', COALESCE(SUM(s.duration_minutes), 0),
    'avg_session_time_minutes', COALESCE(AVG(s.duration_minutes), 0),
    'total_practices_completed', COALESCE(completed_practices.count, 0),
    'total_assessments_taken', COALESCE(assessments.count, 0),
    'daily_streak', COALESCE(streak.current_streak, 0),
    'engagement_score', COALESCE(
      (COUNT(DISTINCT s.id) * 2 + 
       COALESCE(completed_practices.count, 0) * 3 + 
       COALESCE(assessments.count, 0) * 5) / period_days, 
      0
    ),
    'last_activity', MAX(s.created_at)
  )
  INTO result
  FROM user_sessions s
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM daily_practices dp
    WHERE dp.user_id = user_uuid 
      AND dp.completed_at >= start_date
      AND dp.status = 'completed'
  ) completed_practices ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM user_assessments ua
    WHERE ua.user_id = user_uuid
      AND ua.created_at >= start_date
  ) assessments ON true
  LEFT JOIN (
    SELECT calculate_current_streak(user_uuid) as current_streak
  ) streak ON true
  WHERE s.user_id = user_uuid
    AND s.created_at >= start_date;

  RETURN COALESCE(result, json_build_object(
    'user_id', user_uuid,
    'period_days', period_days,
    'total_sessions', 0,
    'total_session_time_minutes', 0,
    'avg_session_time_minutes', 0,
    'total_practices_completed', 0,
    'total_assessments_taken', 0,
    'daily_streak', 0,
    'engagement_score', 0,
    'last_activity', NULL
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user progress over time
CREATE OR REPLACE FUNCTION get_user_progress_analytics(
  user_uuid UUID,
  timeframe TEXT DEFAULT 'month'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  interval_duration INTERVAL;
BEGIN
  -- Set interval based on timeframe
  interval_duration := CASE
    WHEN timeframe = 'week' THEN INTERVAL '7 days'
    WHEN timeframe = 'month' THEN INTERVAL '30 days'
    WHEN timeframe = 'quarter' THEN INTERVAL '90 days'
    WHEN timeframe = 'year' THEN INTERVAL '365 days'
    ELSE INTERVAL '30 days'
  END;

  WITH progress_data AS (
    SELECT 
      date_trunc('day', dp.completed_at) as date,
      COUNT(*) as practices_completed,
      AVG(dp.score) as avg_score
    FROM daily_practices dp
    WHERE dp.user_id = user_uuid
      AND dp.completed_at >= NOW() - interval_duration
      AND dp.status = 'completed'
    GROUP BY date_trunc('day', dp.completed_at)
    ORDER BY date
  ),
  assessment_progress AS (
    SELECT
      date_trunc('week', ua.created_at) as week,
      AVG(ua.overall_score) as avg_assessment_score
    FROM user_assessments ua
    WHERE ua.user_id = user_uuid
      AND ua.created_at >= NOW() - interval_duration
    GROUP BY date_trunc('week', ua.created_at)
    ORDER BY week
  )
  SELECT json_build_object(
    'user_id', user_uuid,
    'timeframe', timeframe,
    'daily_practice_data', COALESCE(
      json_agg(
        json_build_object(
          'date', pd.date,
          'practices_completed', pd.practices_completed,
          'avg_score', ROUND(pd.avg_score::numeric, 2)
        )
        ORDER BY pd.date
      ) FILTER (WHERE pd.date IS NOT NULL),
      '[]'::json
    ),
    'weekly_assessment_data', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'week', ap.week,
          'avg_assessment_score', ROUND(ap.avg_assessment_score::numeric, 2)
        )
        ORDER BY ap.week
      ) FROM assessment_progress ap),
      '[]'::json
    ),
    'summary', json_build_object(
      'total_practices', COALESCE(SUM(pd.practices_completed), 0),
      'avg_daily_score', COALESCE(ROUND(AVG(pd.avg_score)::numeric, 2), 0),
      'active_days', COUNT(DISTINCT pd.date),
      'consistency_rate', COALESCE(
        ROUND(
          COUNT(DISTINCT pd.date)::numeric / 
          EXTRACT(days FROM interval_duration)::numeric * 100, 
          2
        ), 
        0
      )
    )
  )
  INTO result
  FROM progress_data pd;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate current streak
CREATE OR REPLACE FUNCTION calculate_current_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  current_date DATE;
  check_date DATE;
BEGIN
  current_date := CURRENT_DATE;
  check_date := current_date;
  
  -- Check if user has activity today or yesterday (grace period)
  IF NOT EXISTS (
    SELECT 1 FROM daily_practices dp
    WHERE dp.user_id = user_uuid
      AND dp.completed_at::date >= current_date - INTERVAL '1 day'
      AND dp.status = 'completed'
  ) THEN
    RETURN 0;
  END IF;

  -- Count consecutive days backwards
  WHILE EXISTS (
    SELECT 1 FROM daily_practices dp
    WHERE dp.user_id = user_uuid
      AND dp.completed_at::date = check_date
      AND dp.status = 'completed'
  ) LOOP
    streak_count := streak_count + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;

  RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AI ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get AI usage analytics
CREATE OR REPLACE FUNCTION get_ai_usage_analytics(
  period_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_date TIMESTAMP;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * period_days;
  
  WITH ai_metrics AS (
    SELECT
      agent_type,
      COUNT(*) as total_requests,
      AVG(response_time_ms) as avg_response_time,
      AVG(confidence_score) as avg_confidence,
      SUM(token_count) as total_tokens,
      SUM(cost_cents) / 100.0 as total_cost
    FROM ai_requests ar
    WHERE ar.created_at >= start_date
    GROUP BY agent_type
  ),
  daily_usage AS (
    SELECT
      date_trunc('day', created_at) as date,
      COUNT(*) as requests_count,
      SUM(cost_cents) / 100.0 as daily_cost
    FROM ai_requests
    WHERE created_at >= start_date
    GROUP BY date_trunc('day', created_at)
    ORDER BY date
  )
  SELECT json_build_object(
    'period_days', period_days,
    'agent_metrics', COALESCE(
      json_agg(
        json_build_object(
          'agent_type', am.agent_type,
          'total_requests', am.total_requests,
          'avg_response_time_ms', ROUND(am.avg_response_time::numeric, 2),
          'avg_confidence', ROUND(am.avg_confidence::numeric, 3),
          'total_tokens', am.total_tokens,
          'total_cost', ROUND(am.total_cost::numeric, 4)
        )
      ) FILTER (WHERE am.agent_type IS NOT NULL),
      '[]'::json
    ),
    'daily_usage', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'date', du.date,
          'requests_count', du.requests_count,
          'daily_cost', ROUND(du.daily_cost::numeric, 4)
        )
        ORDER BY du.date
      ) FROM daily_usage du),
      '[]'::json
    ),
    'summary', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(total_requests), 0),
        'avg_response_time_ms', COALESCE(ROUND(AVG(avg_response_time)::numeric, 2), 0),
        'total_cost', COALESCE(ROUND(SUM(total_cost)::numeric, 4), 0),
        'cost_per_request', COALESCE(
          ROUND((SUM(total_cost) / NULLIF(SUM(total_requests), 0))::numeric, 6), 
          0
        )
      )
      FROM ai_metrics
    )
  )
  INTO result
  FROM ai_metrics am;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PLATFORM ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get platform-wide analytics
CREATE OR REPLACE FUNCTION get_platform_analytics(
  period_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_date TIMESTAMP;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * period_days;
  
  WITH user_metrics AS (
    SELECT
      COUNT(DISTINCT u.id) as total_users,
      COUNT(DISTINCT CASE WHEN u.created_at >= start_date THEN u.id END) as new_users,
      COUNT(DISTINCT CASE WHEN s.created_at >= start_date THEN s.user_id END) as active_users,
      AVG(CASE WHEN o.completed_at IS NOT NULL THEN 1 ELSE 0 END) as onboarding_completion_rate
    FROM users u
    LEFT JOIN user_sessions s ON u.id = s.user_id
    LEFT JOIN user_onboarding o ON u.id = o.user_id
  ),
  engagement_metrics AS (
    SELECT
      COUNT(*) as total_sessions,
      AVG(duration_minutes) as avg_session_duration,
      COUNT(DISTINCT user_id) as unique_session_users
    FROM user_sessions
    WHERE created_at >= start_date
  ),
  content_metrics AS (
    SELECT
      COUNT(*) as total_practices_completed,
      AVG(score) as avg_practice_score,
      COUNT(DISTINCT user_id) as users_with_practices
    FROM daily_practices
    WHERE completed_at >= start_date AND status = 'completed'
  )
  SELECT json_build_object(
    'period_days', period_days,
    'user_metrics', (
      SELECT json_build_object(
        'total_users', total_users,
        'new_users', new_users,
        'active_users', active_users,
        'onboarding_completion_rate', ROUND(onboarding_completion_rate::numeric, 3)
      )
      FROM user_metrics
    ),
    'engagement_metrics', (
      SELECT json_build_object(
        'total_sessions', total_sessions,
        'avg_session_duration_minutes', ROUND(avg_session_duration::numeric, 2),
        'unique_session_users', unique_session_users
      )
      FROM engagement_metrics
    ),
    'content_metrics', (
      SELECT json_build_object(
        'total_practices_completed', total_practices_completed,
        'avg_practice_score', ROUND(avg_practice_score::numeric, 2),
        'users_with_practices', users_with_practices,
        'practice_completion_rate', COALESCE(
          ROUND((users_with_practices::numeric / NULLIF((SELECT active_users FROM user_metrics), 0))::numeric, 3),
          0
        )
      )
      FROM content_metrics
    )
  )
  INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REAL-TIME ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get real-time dashboard metrics
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'active_users_now', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_sessions
      WHERE created_at >= NOW() - INTERVAL '15 minutes'
    ),
    'sessions_last_hour', (
      SELECT COUNT(*)
      FROM user_sessions
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    ),
    'ai_requests_last_hour', (
      SELECT COUNT(*)
      FROM ai_requests
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    ),
    'practices_completed_today', (
      SELECT COUNT(*)
      FROM daily_practices
      WHERE completed_at::date = CURRENT_DATE
        AND status = 'completed'
    ),
    'avg_response_time_last_hour', (
      SELECT COALESCE(ROUND(AVG(response_time_ms)::numeric, 2), 0)
      FROM ai_requests
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    ),
    'system_health_score', (
      -- Simple health score calculation
      SELECT CASE 
        WHEN error_rate < 0.01 THEN 100
        WHEN error_rate < 0.05 THEN 85
        WHEN error_rate < 0.1 THEN 70
        ELSE 50
      END as health_score
      FROM (
        SELECT 
          COALESCE(
            COUNT(*) FILTER (WHERE success = false)::numeric / 
            NULLIF(COUNT(*)::numeric, 0), 
            0
          ) as error_rate
        FROM ai_requests
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      ) error_calc
    ),
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_engagement_metrics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_progress_analytics(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_current_streak(UUID) TO authenticated;

-- Grant execute permissions for admin functions (restrict as needed)
GRANT EXECUTE ON FUNCTION get_ai_usage_analytics(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_platform_analytics(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_realtime_metrics() TO service_role;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_created 
ON user_sessions(user_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_practices_user_completed 
ON daily_practices(user_id, completed_at) WHERE status = 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_requests_created_agent 
ON ai_requests(created_at, agent_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_assessments_user_created 
ON user_assessments(user_id, created_at);
