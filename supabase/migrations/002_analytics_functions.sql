-- Advanced Analytics Functions for Kasama AI
-- This migration adds sophisticated analytics and reporting functions

-- Function: Get comprehensive user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(
  user_id UUID,
  date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_practices BIGINT,
  current_streak BIGINT,
  longest_streak BIGINT,
  completion_rate NUMERIC,
  average_rating NUMERIC,
  total_session_minutes BIGINT,
  favorite_categories JSONB,
  progress_trend JSONB,
  mood_improvement NUMERIC,
  learning_velocity NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  date_from_filter TIMESTAMP WITH TIME ZONE;
  date_to_filter TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set default date range if not provided
  date_from_filter := COALESCE(date_from, NOW() - INTERVAL '30 days');
  date_to_filter := COALESCE(date_to, NOW());
  
  RETURN QUERY
  WITH progress_data AS (
    SELECT 
      p.*,
      EXTRACT(EPOCH FROM (completed_at - LAG(completed_at) OVER (ORDER BY completed_at))) / 86400 as days_since_last
    FROM progress p
    WHERE p.user_id = get_user_statistics.user_id
      AND p.completed_at BETWEEN date_from_filter AND date_to_filter
  ),
  
  -- Calculate streaks
  streak_data AS (
    SELECT 
      completed_at::date as completion_date,
      COUNT(*) as daily_count,
      -- Identify consecutive days
      completed_at::date - (ROW_NUMBER() OVER (ORDER BY completed_at::date))::integer * INTERVAL '1 day' as streak_group
    FROM progress_data
    GROUP BY completed_at::date
  ),
  
  streak_groups AS (
    SELECT 
      streak_group,
      COUNT(*) as streak_length,
      MAX(completion_date) as streak_end
    FROM streak_data
    GROUP BY streak_group
  ),
  
  -- Category analysis
  category_stats AS (
    SELECT 
      pr.category,
      COUNT(*) as count,
      AVG(p.rating) as avg_rating
    FROM progress_data p
    JOIN practices pr ON p.practice_id = pr.id
    WHERE pr.category IS NOT NULL
    GROUP BY pr.category
    ORDER BY count DESC
  ),
  
  -- Weekly progress trend
  weekly_trend AS (
    SELECT 
      date_trunc('week', completed_at) as week,
      COUNT(*) as activity_count,
      AVG(rating) as avg_rating,
      AVG(mood_after - mood_before) as mood_change
    FROM progress_data
    WHERE completed_at >= date_from_filter
    GROUP BY date_trunc('week', completed_at)
    ORDER BY week
  )
  
  SELECT 
    -- Total practices completed
    (SELECT COUNT(*) FROM progress_data WHERE practice_id IS NOT NULL),
    
    -- Current streak (consecutive days with activity)
    COALESCE((
      SELECT streak_length 
      FROM streak_groups 
      WHERE streak_end = CURRENT_DATE 
        OR streak_end = CURRENT_DATE - INTERVAL '1 day'
      ORDER BY streak_end DESC 
      LIMIT 1
    ), 0),
    
    -- Longest streak in period
    COALESCE((SELECT MAX(streak_length) FROM streak_groups), 0),
    
    -- Completion rate (practices completed vs assigned)
    CASE 
      WHEN (SELECT COUNT(*) FROM learning_paths lp WHERE lp.user_id = get_user_statistics.user_id AND NOT lp.completed) > 0
      THEN (SELECT COUNT(*) FROM progress_data WHERE practice_id IS NOT NULL)::NUMERIC / 
           NULLIF((SELECT array_length(practices, 1) FROM learning_paths WHERE user_id = get_user_statistics.user_id AND NOT completed LIMIT 1), 0)
      ELSE 1.0
    END,
    
    -- Average rating
    (SELECT AVG(rating) FROM progress_data WHERE rating IS NOT NULL),
    
    -- Total session minutes
    COALESCE((SELECT SUM(session_duration_seconds) / 60 FROM progress_data WHERE session_duration_seconds IS NOT NULL), 0),
    
    -- Favorite categories (top 3)
    (SELECT jsonb_agg(
      jsonb_build_object(
        'category', category,
        'count', count,
        'avg_rating', ROUND(avg_rating, 2)
      )
    ) FROM (SELECT * FROM category_stats LIMIT 3) cs),
    
    -- Progress trend (weekly data)
    (SELECT jsonb_agg(
      jsonb_build_object(
        'week', week,
        'count', activity_count,
        'avg_rating', ROUND(avg_rating, 2),
        'mood_improvement', ROUND(mood_change, 2)
      ) ORDER BY week
    ) FROM weekly_trend),
    
    -- Overall mood improvement
    COALESCE((
      SELECT AVG(mood_after - mood_before) 
      FROM progress_data 
      WHERE mood_before IS NOT NULL AND mood_after IS NOT NULL
    ), 0),
    
    -- Learning velocity (activities per week)
    CASE 
      WHEN EXTRACT(EPOCH FROM (date_to_filter - date_from_filter)) / 604800 > 0
      THEN (SELECT COUNT(*) FROM progress_data WHERE practice_id IS NOT NULL)::NUMERIC / 
           (EXTRACT(EPOCH FROM (date_to_filter - date_from_filter)) / 604800)
      ELSE 0
    END;
END;
$$;

-- Function: Get personalized learning recommendations
CREATE OR REPLACE FUNCTION get_learning_recommendations(
  user_id UUID,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  practice_id UUID,
  title TEXT,
  category TEXT,
  difficulty difficulty_level,
  estimated_time INTEGER,
  reason TEXT,
  confidence_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    -- Get user's activity patterns
    SELECT 
      p.category,
      p.difficulty,
      COUNT(*) as completed_count,
      AVG(pr.rating) as avg_rating,
      MAX(pr.completed_at) as last_completed
    FROM practices p
    JOIN progress pr ON p.id = pr.practice_id
    WHERE pr.user_id = get_learning_recommendations.user_id
    GROUP BY p.category, p.difficulty
  ),
  
  user_preferences AS (
    -- Identify user preferences
    SELECT 
      category,
      difficulty,
      completed_count,
      avg_rating,
      -- Calculate preference score
      (completed_count * 0.3 + COALESCE(avg_rating, 3) * 0.7) as preference_score,
      EXTRACT(EPOCH FROM (NOW() - last_completed)) / 86400 as days_since_last
    FROM user_stats
  ),
  
  completed_practices AS (
    -- Get list of completed practices to avoid duplicates
    SELECT DISTINCT practice_id
    FROM progress
    WHERE user_id = get_learning_recommendations.user_id
      AND practice_id IS NOT NULL
  ),
  
  recommendation_candidates AS (
    SELECT 
      p.id,
      p.title,
      p.category,
      p.difficulty,
      p.estimated_time_minutes,
      
      -- Scoring algorithm
      CASE 
        -- Prefer categories user has shown interest in
        WHEN up.category IS NOT NULL THEN up.preference_score * 0.4
        ELSE 0.2
      END +
      
      -- Prefer appropriate difficulty progression
      CASE 
        WHEN up.difficulty IS NOT NULL THEN
          CASE 
            WHEN p.difficulty = up.difficulty THEN 0.3
            WHEN p.difficulty::text > up.difficulty::text THEN 0.25 -- Next level
            ELSE 0.1
          END
        ELSE 0.2
      END +
      
      -- Time-based factors
      CASE 
        WHEN up.days_since_last IS NOT NULL AND up.days_since_last > 7 THEN 0.2 -- Haven't done this category recently
        WHEN up.days_since_last IS NOT NULL AND up.days_since_last < 3 THEN 0.05 -- Recently active in category
        ELSE 0.15
      END +
      
      -- Variety bonus (explore new categories)
      CASE 
        WHEN up.category IS NULL THEN 0.1
        ELSE 0
      END as recommendation_score,
      
      -- Generate reason
      CASE 
        WHEN up.category IS NOT NULL AND up.avg_rating >= 4 
          THEN 'You enjoyed similar ' || up.category || ' practices'
        WHEN up.category IS NOT NULL AND up.days_since_last > 7 
          THEN 'Continue building on your ' || up.category || ' progress'
        WHEN up.category IS NULL 
          THEN 'Explore new area: ' || p.category
        WHEN p.difficulty::text > COALESCE(up.difficulty::text, 'beginner') 
          THEN 'Ready for next level in ' || p.category
        ELSE 'Recommended based on your learning pattern'
      END as recommendation_reason
      
    FROM practices p
    LEFT JOIN user_preferences up ON p.category = up.category
    WHERE p.id NOT IN (SELECT practice_id FROM completed_practices WHERE practice_id IS NOT NULL)
    ORDER BY recommendation_score DESC
    LIMIT limit_count * 2 -- Get extra candidates for final selection
  )
  
  SELECT 
    rc.id,
    rc.title,
    rc.category,
    rc.difficulty,
    rc.estimated_time_minutes,
    rc.recommendation_reason,
    ROUND(rc.recommendation_score * 100, 1) -- Convert to percentage
  FROM recommendation_candidates rc
  ORDER BY rc.recommendation_score DESC
  LIMIT limit_count;
END;
$$;

-- Function: AI cost analysis and optimization insights
CREATE OR REPLACE FUNCTION get_ai_cost_analysis(
  user_id UUID DEFAULT NULL,
  date_from TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  date_to TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_cost_dollars NUMERIC,
  total_requests BIGINT,
  cost_by_agent JSONB,
  cache_efficiency NUMERIC,
  average_tokens_per_request NUMERIC,
  cost_trend JSONB,
  optimization_recommendations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_interactions BIGINT;
  total_cached BIGINT;
BEGIN
  RETURN QUERY
  WITH filtered_interactions AS (
    SELECT *
    FROM ai_interactions ai
    WHERE ai.created_at BETWEEN date_from AND date_to
      AND (get_ai_cost_analysis.user_id IS NULL OR ai.user_id = get_ai_cost_analysis.user_id)
  ),
  
  agent_costs AS (
    SELECT 
      agent_type,
      SUM(cost_cents) as total_cost_cents,
      COUNT(*) as request_count,
      AVG(token_count) as avg_tokens,
      AVG(processing_time_ms) as avg_processing_time,
      SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits
    FROM filtered_interactions
    GROUP BY agent_type
  ),
  
  daily_costs AS (
    SELECT 
      DATE(created_at) as cost_date,
      SUM(cost_cents) / 100.0 as daily_cost,
      COUNT(*) as daily_requests,
      AVG(token_count) as avg_daily_tokens
    FROM filtered_interactions
    GROUP BY DATE(created_at)
    ORDER BY cost_date
  ),
  
  optimization_analysis AS (
    SELECT 
      agent_type,
      total_cost_cents,
      request_count,
      cache_hits,
      ROUND((cache_hits::NUMERIC / NULLIF(request_count, 0) * 100), 2) as cache_hit_rate,
      avg_tokens,
      avg_processing_time,
      -- Identify optimization opportunities
      CASE 
        WHEN cache_hits::NUMERIC / NULLIF(request_count, 0) < 0.3 THEN 'Low cache efficiency'
        WHEN avg_tokens > 1000 THEN 'High token usage'
        WHEN avg_processing_time > 3000 THEN 'Slow response times'
        ELSE 'Optimized'
      END as optimization_status
    FROM agent_costs
  )
  
  SELECT 
    -- Total cost in dollars
    COALESCE((SELECT SUM(cost_cents) / 100.0 FROM filtered_interactions), 0),
    
    -- Total requests
    COALESCE((SELECT COUNT(*) FROM filtered_interactions), 0),
    
    -- Cost breakdown by agent
    COALESCE((
      SELECT jsonb_object_agg(
        agent_type,
        jsonb_build_object(
          'cost_dollars', ROUND(total_cost_cents / 100.0, 4),
          'requests', request_count,
          'avg_tokens', ROUND(avg_tokens, 0),
          'cache_hit_rate', ROUND((cache_hits::NUMERIC / NULLIF(request_count, 0) * 100), 1),
          'avg_response_time_ms', ROUND(avg_processing_time, 0)
        )
      )
      FROM agent_costs
    ), '{}'::jsonb),
    
    -- Overall cache efficiency
    COALESCE((
      SELECT ROUND((SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
      FROM filtered_interactions
    ), 0),
    
    -- Average tokens per request
    COALESCE((SELECT AVG(token_count) FROM filtered_interactions), 0),
    
    -- Cost trend (daily)
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', cost_date,
          'cost', daily_cost,
          'requests', daily_requests,
          'avg_tokens', ROUND(avg_daily_tokens, 0)
        ) ORDER BY cost_date
      )
      FROM daily_costs
    ), '[]'::jsonb),
    
    -- Optimization recommendations
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'agent_type', agent_type,
          'status', optimization_status,
          'recommendation', 
            CASE 
              WHEN optimization_status = 'Low cache efficiency' 
                THEN 'Implement semantic caching for ' || agent_type::text || ' requests'
              WHEN optimization_status = 'High token usage' 
                THEN 'Optimize prompts for ' || agent_type::text || ' to reduce token consumption'
              WHEN optimization_status = 'Slow response times' 
                THEN 'Investigate performance bottlenecks for ' || agent_type::text
              ELSE 'Performance is optimal for ' || agent_type::text
            END,
          'priority', 
            CASE 
              WHEN optimization_status = 'Low cache efficiency' THEN 'high'
              WHEN optimization_status = 'High token usage' THEN 'medium'
              WHEN optimization_status = 'Slow response times' THEN 'high'
              ELSE 'low'
            END
        )
      )
      FROM optimization_analysis
      WHERE optimization_status != 'Optimized'
    ), '[]'::jsonb);
END;
$$;

-- Function: Performance monitoring and alerting
CREATE OR REPLACE FUNCTION get_system_health_metrics()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT,
  status TEXT,
  threshold NUMERIC,
  recommendations TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    SELECT 
      'active_connections' as name,
      (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active')::numeric as value,
      'connections' as unit,
      20::numeric as threshold_val
    
    UNION ALL
    
    SELECT 
      'avg_ai_response_time' as name,
      COALESCE((
        SELECT AVG(processing_time_ms) 
        FROM ai_interactions 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      ), 0) as value,
      'milliseconds' as unit,
      2000::numeric as threshold_val
      
    UNION ALL
    
    SELECT 
      'hourly_request_rate' as name,
      COALESCE((
        SELECT COUNT(*)
        FROM ai_interactions 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      ), 0) as value,
      'requests/hour' as unit,
      1000::numeric as threshold_val
      
    UNION ALL
    
    SELECT 
      'cache_hit_rate' as name,
      COALESCE((
        SELECT (SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100)
        FROM ai_interactions
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      ), 0) as value,
      'percentage' as unit,
      50::numeric as threshold_val
      
    UNION ALL
    
    SELECT 
      'error_rate' as name,
      COALESCE((
        SELECT COUNT(*)::NUMERIC / NULLIF((
          SELECT COUNT(*) FROM ai_interactions WHERE created_at >= NOW() - INTERVAL '1 hour'
        ), 0) * 100
        FROM ai_interactions 
        WHERE created_at >= NOW() - INTERVAL '1 hour' 
          AND (output_data->>'error') IS NOT NULL
      ), 0) as value,
      'percentage' as unit,
      5::numeric as threshold_val
  )
  
  SELECT 
    m.name,
    m.value,
    m.unit,
    CASE 
      WHEN m.name = 'cache_hit_rate' AND m.value < m.threshold_val THEN 'warning'
      WHEN m.name = 'error_rate' AND m.value > m.threshold_val THEN 'critical'
      WHEN m.name = 'avg_ai_response_time' AND m.value > m.threshold_val THEN 'warning'
      WHEN m.name = 'hourly_request_rate' AND m.value > m.threshold_val THEN 'warning'
      WHEN m.name = 'active_connections' AND m.value > m.threshold_val THEN 'warning'
      ELSE 'healthy'
    END,
    m.threshold_val,
    CASE 
      WHEN m.name = 'cache_hit_rate' AND m.value < m.threshold_val 
        THEN ARRAY['Implement semantic caching', 'Review query optimization', 'Consider Redis cache layer']
      WHEN m.name = 'error_rate' AND m.value > m.threshold_val 
        THEN ARRAY['Investigate error logs', 'Implement circuit breakers', 'Add retry mechanisms']
      WHEN m.name = 'avg_ai_response_time' AND m.value > m.threshold_val 
        THEN ARRAY['Optimize AI prompts', 'Implement request batching', 'Scale AI infrastructure']
      WHEN m.name = 'hourly_request_rate' AND m.value > m.threshold_val 
        THEN ARRAY['Implement rate limiting', 'Scale infrastructure', 'Optimize expensive operations']
      WHEN m.name = 'active_connections' AND m.value > m.threshold_val 
        THEN ARRAY['Review connection pooling', 'Optimize query performance', 'Scale database']
      ELSE ARRAY['System performing optimally']
    END
  FROM metrics m;
END;
$$;

-- Function: Automated partition management
CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_month DATE;
  next_week DATE;
BEGIN
  -- Create next month's assessment partition
  next_month := date_trunc('month', NOW()) + INTERVAL '2 months';
  PERFORM create_monthly_assessment_partition(next_month);
  
  -- Create next week's AI interaction partition
  next_week := date_trunc('week', NOW()) + INTERVAL '2 weeks';
  PERFORM create_weekly_ai_partition(next_week);
  
  -- Clean up old partitions (older than 1 year)
  -- This would be implemented based on data retention policies
  
  RAISE NOTICE 'Partition maintenance completed at %', NOW();
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_learning_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_cost_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_health_metrics TO service_role;
GRANT EXECUTE ON FUNCTION maintain_partitions TO service_role;

-- Create scheduled maintenance job (requires pg_cron extension)
-- SELECT cron.schedule('partition-maintenance', '0 2 * * 0', 'SELECT maintain_partitions();');

-- Add helpful comments
COMMENT ON FUNCTION get_user_statistics IS 'Comprehensive user analytics including streaks, completion rates, and progress trends';
COMMENT ON FUNCTION get_learning_recommendations IS 'AI-powered personalized learning recommendations based on user behavior';
COMMENT ON FUNCTION get_ai_cost_analysis IS 'Cost optimization analysis for AI interactions with actionable insights';
COMMENT ON FUNCTION get_system_health_metrics IS 'System health monitoring with performance metrics and recommendations';
COMMENT ON FUNCTION maintain_partitions IS 'Automated partition management for high-volume tables';