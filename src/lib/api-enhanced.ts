import { getOptimizedSupabase } from "./supabase-optimized";
import { performanceMonitor } from "../services/performance-monitor";
import { aiOptimizer } from "../services/ai-performance-optimizer";
import {
  User,
  Assessment,
  Practice,
  Goal,
  Progress,
  CreateAssessmentRequest,
  SubmitAssessmentRequest,
  CreateGoalRequest,
  UpdateGoalRequest,
  AsyncActionResult,
  Answer,
} from "./types";
import { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

// Enhanced error handling with more context
class EnhancedApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any,
    public endpoint?: string,
    public operation?: string
  ) {
    super(message);
    this.name = "EnhancedApiError";
  }
}

// Rate limiting service
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private limits = {
    global: { requests: 1000, windowMs: 60 * 1000 }, // 1000 requests per minute
    user: { requests: 100, windowMs: 60 * 1000 },    // 100 requests per user per minute
    ai: { requests: 10, windowMs: 60 * 1000 }        // 10 AI requests per user per minute
  };

  checkLimit(key: string, type: 'global' | 'user' | 'ai'): boolean {
    const limit = this.limits[type];
    const now = Date.now();
    const entry = this.requests.get(`${type}:${key}`);

    if (!entry || now > entry.resetTime) {
      this.requests.set(`${type}:${key}`, {
        count: 1,
        resetTime: now + limit.windowMs
      });
      return true;
    }

    if (entry.count >= limit.requests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(key: string, type: 'global' | 'user' | 'ai'): number {
    const limit = this.limits[type];
    const entry = this.requests.get(`${type}:${key}`);
    
    if (!entry || Date.now() > entry.resetTime) {
      return limit.requests;
    }
    
    return Math.max(0, limit.requests - entry.count);
  }

  getResetTime(key: string, type: 'global' | 'user' | 'ai'): Date | null {
    const entry = this.requests.get(`${type}:${key}`);
    return entry ? new Date(entry.resetTime) : null;
  }
}

// Request retry logic with exponential backoff
class RetryManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      retryCondition?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      retryCondition = (error: any) => error.status >= 500 || error.status === 429
    } = options;

    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        const jitter = Math.random() * 0.1 * delay;
        
        console.warn(`Retry attempt ${attempt + 1} after ${delay + jitter}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
    
    throw lastError;
  }
}

// Enhanced API wrapper with performance monitoring and caching
class EnhancedAPI {
  private supabase = getOptimizedSupabase();
  private rateLimiter = new RateLimiter();
  private retryManager = new RetryManager();

  /**
   * Generic API wrapper with comprehensive monitoring
   */
  private async apiWrapper<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    metadata: {
      endpoint: string;
      operation: string;
      userId?: string;
      cacheKey?: string;
      cacheTTL?: number;
      requiresAuth?: boolean;
      rateLimit?: { type: 'user' | 'ai'; key: string };
    }
  ): Promise<AsyncActionResult<T> & { fromCache?: boolean; remaining?: number }> {
    const startTime = Date.now();
    let fromCache = false;
    let remaining: number | undefined;

    try {
      // Rate limiting check
      if (metadata.rateLimit) {
        const canProceed = this.rateLimiter.checkLimit(
          metadata.rateLimit.key, 
          metadata.rateLimit.type
        );
        
        if (!canProceed) {
          const resetTime = this.rateLimiter.getResetTime(
            metadata.rateLimit.key, 
            metadata.rateLimit.type
          );
          
          throw new EnhancedApiError(
            `Rate limit exceeded. Try again at ${resetTime?.toISOString()}`,
            429,
            'RATE_LIMIT_EXCEEDED',
            { resetTime },
            metadata.endpoint,
            metadata.operation
          );
        }
        
        remaining = this.rateLimiter.getRemainingRequests(
          metadata.rateLimit.key,
          metadata.rateLimit.type
        );
      }

      // Try cache first if enabled
      if (metadata.cacheKey) {
        const cached = await this.supabase.cachedQuery(
          metadata.cacheKey,
          operation,
          metadata.cacheTTL
        );
        
        if (cached.fromCache) {
          fromCache = true;
          
          // Record cache hit
          performanceMonitor.recordAPIMetric({
            endpoint: metadata.endpoint,
            method: 'GET',
            statusCode: 200,
            responseTime: Date.now() - startTime,
            userId: metadata.userId,
          });
          
          return { 
            data: cached.data, 
            error: cached.error ? new Error(cached.error.message) : null,
            fromCache,
            remaining
          };
        }
      }

      // Execute with retry logic
      const result = await this.retryManager.executeWithRetry(operation);

      // Record successful API call
      performanceMonitor.recordAPIMetric({
        endpoint: metadata.endpoint,
        method: 'POST', // Assume POST for mutations, GET for queries
        statusCode: result.error ? (result.error.status || 500) : 200,
        responseTime: Date.now() - startTime,
        userId: metadata.userId,
      });

      if (result.error) {
        throw new EnhancedApiError(
          result.error.message || "An error occurred",
          result.error.status,
          result.error.code,
          result.error,
          metadata.endpoint,
          metadata.operation
        );
      }

      return { 
        data: result.data, 
        error: null, 
        fromCache, 
        remaining 
      };

    } catch (error) {
      // Record error
      performanceMonitor.recordAPIMetric({
        endpoint: metadata.endpoint,
        method: 'POST',
        statusCode: error instanceof EnhancedApiError ? (error.status || 500) : 500,
        responseTime: Date.now() - startTime,
        userId: metadata.userId,
      });

      console.error(`API Error [${metadata.endpoint}]:`, error);
      
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error occurred"),
        fromCache,
        remaining
      };
    }
  }

  /**
   * Enhanced Authentication API with session management
   */
  auth = {
    signIn: async (
      email: string,
      password: string,
      options?: { rememberMe?: boolean }
    ): Promise<AsyncActionResult<User> & { sessionInfo?: any }> => {
      const result = await this.apiWrapper(
        () => this.supabase.mainClient.auth.signInWithPassword({ 
          email, 
          password 
        }),
        {
          endpoint: '/auth/signin',
          operation: 'sign_in',
          rateLimit: { type: 'user', key: email },
        }
      );

      // Store session preferences
      if (result.data && options?.rememberMe) {
        localStorage.setItem('kasama_remember_user', 'true');
      }

      return result;
    },

    signUp: async (
      email: string,
      password: string,
      metadata?: any
    ): Promise<AsyncActionResult<User>> => {
      return this.apiWrapper(
        () => this.supabase.mainClient.auth.signUp({
          email,
          password,
          options: { data: metadata },
        }),
        {
          endpoint: '/auth/signup',
          operation: 'sign_up',
          rateLimit: { type: 'user', key: email },
        }
      );
    },

    signOut: async (): Promise<AsyncActionResult<void>> => {
      localStorage.removeItem('kasama_remember_user');
      
      return this.apiWrapper(
        () => this.supabase.mainClient.auth.signOut(),
        {
          endpoint: '/auth/signout',
          operation: 'sign_out',
        }
      );
    },

    refreshSession: async (): Promise<AsyncActionResult<User> & { expiresIn?: number }> => {
      const result = await this.apiWrapper(
        async () => {
          const { data, error } = await this.supabase.mainClient.auth.refreshSession();
          return { data: data.user, error };
        },
        {
          endpoint: '/auth/refresh',
          operation: 'refresh_session',
        }
      );

      if (result.data) {
        const session = await this.supabase.mainClient.auth.getSession();
        const expiresIn = session.data.session?.expires_in;
        
        return { ...result, expiresIn };
      }

      return result;
    },

    getCurrentUser: async (): Promise<AsyncActionResult<User>> => {
      return this.apiWrapper(
        async () => {
          const { data: { user }, error } = await this.supabase.mainClient.auth.getUser();
          return { data: user, error };
        },
        {
          endpoint: '/auth/user',
          operation: 'get_current_user',
          cacheKey: 'current_user',
          cacheTTL: 5 * 60 * 1000, // 5 minutes
        }
      );
    },

    updateProfile: async (
      updates: Partial<Tables["profiles"]["Update"]>
    ): Promise<AsyncActionResult<Tables["profiles"]["Row"]>> => {
      return this.apiWrapper(
        async () => {
          const { data: { user } } = await this.supabase.mainClient.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const { data, error } = await this.supabase.mainClient
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select()
            .single();

          return { data, error };
        },
        {
          endpoint: '/auth/profile',
          operation: 'update_profile',
          requiresAuth: true,
        }
      );
    },
  };

  /**
   * Enhanced Assessments API with AI integration
   */
  assessments = {
    getAll: async (
      userId: string,
      filters?: { type?: string; completed?: boolean }
    ): Promise<AsyncActionResult<Tables["assessments"]["Row"][]>> => {
      const cacheKey = `assessments_${userId}_${JSON.stringify(filters || {})}`;
      
      return this.apiWrapper(
        async () => {
          let query = this.supabase.mainClient
            .from("assessments")
            .select("*")
            .eq('user_id', userId)
            .order("created_at", { ascending: false });

          if (filters?.type) {
            query = query.eq('type', filters.type);
          }
          
          if (filters?.completed !== undefined) {
            query = query.eq('completed', filters.completed);
          }

          return query;
        },
        {
          endpoint: '/assessments',
          operation: 'get_assessments',
          userId,
          cacheKey,
          cacheTTL: 2 * 60 * 1000, // 2 minutes
          rateLimit: { type: 'user', key: userId },
        }
      );
    },

    create: async (
      assessment: Tables["assessments"]["Insert"]
    ): Promise<AsyncActionResult<Tables["assessments"]["Row"]>> => {
      return this.apiWrapper(
        () => this.supabase.mainClient
          .from("assessments")
          .insert(assessment)
          .select()
          .single(),
        {
          endpoint: '/assessments',
          operation: 'create_assessment',
          userId: assessment.user_id,
          rateLimit: { type: 'user', key: assessment.user_id },
        }
      );
    },

    submit: async (
      submission: SubmitAssessmentRequest & { userId: string }
    ): Promise<AsyncActionResult<Tables["assessments"]["Row"] & { aiInsights?: any }>> => {
      return this.apiWrapper(
        async () => {
          // Insert answers first
          const { error: answersError } = await this.supabase.mainClient
            .from("assessment_answers")
            .insert(
              submission.answers.map((answer: Answer) => ({
                assessment_id: submission.assessmentId,
                question_id: answer.questionId,
                answer: answer.answer,
                score: answer.score,
                response_time_seconds: answer.responseTime || null,
              }))
            );

          if (answersError) throw answersError;

          // Generate AI insights using the optimizer
          const aiResponse = await aiOptimizer.processAIRequest({
            userId: submission.userId,
            agentType: 'assessment_analyst',
            inputData: {
              assessmentId: submission.assessmentId,
              answers: submission.answers,
              assessmentType: 'relationship_readiness', // Would be dynamic
            },
            priority: 'medium',
          });

          // Update assessment with completion and insights
          const { data, error } = await this.supabase.mainClient
            .from("assessments")
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
              score: aiResponse.output.score || null,
              insights: aiResponse.output.insights || {},
            })
            .eq("id", submission.assessmentId)
            .select()
            .single();

          return { data: { ...data, aiInsights: aiResponse.output }, error };
        },
        {
          endpoint: '/assessments/submit',
          operation: 'submit_assessment',
          userId: submission.userId,
          rateLimit: { type: 'ai', key: submission.userId },
        }
      );
    },

    getInsights: async (
      userId: string,
      assessmentId: string
    ): Promise<AsyncActionResult<{ insights: any; recommendations: any[] }>> => {
      return this.apiWrapper(
        async () => {
          // Get assessment data
          const { data: assessment, error: assessmentError } = await this.supabase.mainClient
            .from('assessments')
            .select('*, assessment_answers(*)')
            .eq('id', assessmentId)
            .eq('user_id', userId)
            .single();

          if (assessmentError) throw assessmentError;

          // Generate detailed insights using AI
          const aiResponse = await aiOptimizer.processAIRequest({
            userId,
            agentType: 'insight_generator',
            inputData: {
              assessment,
              requestType: 'detailed_insights',
            },
            priority: 'medium',
          });

          return { 
            data: {
              insights: aiResponse.output.insights,
              recommendations: aiResponse.output.recommendations || [],
            }, 
            error: null 
          };
        },
        {
          endpoint: `/assessments/${assessmentId}/insights`,
          operation: 'get_assessment_insights',
          userId,
          cacheKey: `assessment_insights_${assessmentId}`,
          cacheTTL: 10 * 60 * 1000, // 10 minutes
          rateLimit: { type: 'ai', key: userId },
        }
      );
    },
  };

  /**
   * Enhanced Learning API with personalized recommendations
   */
  learning = {
    getPractices: async (
      filters?: { 
        category?: string; 
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        userId?: string;
      }
    ): Promise<AsyncActionResult<Tables["practices"]["Row"][]>> => {
      const cacheKey = `practices_${JSON.stringify(filters || {})}`;
      
      return this.apiWrapper(
        async () => {
          let query = this.supabase.mainClient
            .from("practices")
            .select("*")
            .order("title");

          if (filters?.category) {
            query = query.eq('category', filters.category);
          }
          
          if (filters?.difficulty) {
            query = query.eq('difficulty', filters.difficulty);
          }

          return query;
        },
        {
          endpoint: '/learning/practices',
          operation: 'get_practices',
          userId: filters?.userId,
          cacheKey,
          cacheTTL: 15 * 60 * 1000, // 15 minutes
          rateLimit: filters?.userId ? { type: 'user', key: filters.userId } : undefined,
        }
      );
    },

    getPersonalizedRecommendations: async (
      userId: string,
      limit: number = 5
    ): Promise<AsyncActionResult<Array<{
      practice: Tables["practices"]["Row"];
      reason: string;
      confidence: number;
    }>>> => {
      return this.apiWrapper(
        async () => {
          // Get user's progress and assessment data
          const [progressResult, assessmentsResult] = await Promise.all([
            this.supabase.mainClient
              .from('progress')
              .select('*, practices(*)')
              .eq('user_id', userId)
              .order('completed_at', { ascending: false })
              .limit(50),
            this.supabase.mainClient
              .from('assessments')
              .select('*')
              .eq('user_id', userId)
              .eq('completed', true)
              .order('completed_at', { ascending: false })
              .limit(10)
          ]);

          if (progressResult.error) throw progressResult.error;
          if (assessmentsResult.error) throw assessmentsResult.error;

          // Use AI to generate personalized recommendations
          const aiResponse = await aiOptimizer.processAIRequest({
            userId,
            agentType: 'learning_coach',
            inputData: {
              userProgress: progressResult.data,
              assessmentHistory: assessmentsResult.data,
              requestType: 'personalized_recommendations',
              limit,
            },
            priority: 'medium',
          });

          return { data: aiResponse.output.recommendations || [], error: null };
        },
        {
          endpoint: '/learning/recommendations',
          operation: 'get_personalized_recommendations',
          userId,
          cacheKey: `recommendations_${userId}`,
          cacheTTL: 30 * 60 * 1000, // 30 minutes
          rateLimit: { type: 'ai', key: userId },
        }
      );
    },

    createLearningPath: async (
      userId: string,
      preferences: {
        focusAreas: string[];
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        timeCommitment: 'light' | 'moderate' | 'intensive';
        duration: number; // weeks
      }
    ): Promise<AsyncActionResult<Tables["learning_paths"]["Row"]>> => {
      return this.apiWrapper(
        async () => {
          // Use AI to create a personalized learning path
          const aiResponse = await aiOptimizer.processAIRequest({
            userId,
            agentType: 'learning_coach',
            inputData: {
              preferences,
              requestType: 'create_learning_path',
            },
            priority: 'high',
          });

          const learningPath = aiResponse.output;
          
          // Save the learning path
          const { data, error } = await this.supabase.mainClient
            .from('learning_paths')
            .insert({
              user_id: userId,
              name: learningPath.name,
              description: learningPath.description,
              difficulty: preferences.difficulty,
              estimated_duration_weeks: preferences.duration,
              practices: learningPath.practiceIds || [],
            })
            .select()
            .single();

          return { data, error };
        },
        {
          endpoint: '/learning/paths',
          operation: 'create_learning_path',
          userId,
          rateLimit: { type: 'ai', key: userId },
        }
      );
    },

    updateProgress: async (
      userId: string,
      practiceId: string,
      progressData: {
        rating?: number;
        notes?: string;
        sessionDuration?: number;
        moodBefore?: number;
        moodAfter?: number;
      }
    ): Promise<AsyncActionResult<Tables["progress"]["Row"]>> => {
      return this.apiWrapper(
        () => this.supabase.mainClient
          .from("progress")
          .insert({
            user_id: userId,
            practice_id: practiceId,
            completed_at: new Date().toISOString(),
            rating: progressData.rating || null,
            notes: progressData.notes || null,
            session_duration_seconds: progressData.sessionDuration || null,
            mood_before: progressData.moodBefore || null,
            mood_after: progressData.moodAfter || null,
          })
          .select()
          .single(),
        {
          endpoint: '/learning/progress',
          operation: 'update_progress',
          userId,
          rateLimit: { type: 'user', key: userId },
        }
      );
    },
  };

  /**
   * Performance and Analytics API
   */
  analytics = {
    getUserStatistics: async (
      userId: string,
      dateRange?: { from: string; to: string }
    ): Promise<AsyncActionResult<{
      totalPractices: number;
      currentStreak: number;
      longestStreak: number;
      completionRate: number;
      averageRating: number;
      totalSessionMinutes: number;
      favoriteCategories: Array<{ category: string; count: number }>;
      progressTrend: Array<{ date: string; count: number }>;
    }>> => {
      const cacheKey = `user_stats_${userId}_${JSON.stringify(dateRange || {})}`;
      
      return this.apiWrapper(
        async () => {
          // Call Supabase function for complex analytics
          const { data, error } = await this.supabase.mainClient
            .rpc('get_user_statistics', {
              user_id: userId,
              date_from: dateRange?.from || null,
              date_to: dateRange?.to || null,
            });

          if (error) throw error;
          
          return { data: data[0] || {}, error: null };
        },
        {
          endpoint: '/analytics/user',
          operation: 'get_user_statistics',
          userId,
          cacheKey,
          cacheTTL: 10 * 60 * 1000, // 10 minutes
          rateLimit: { type: 'user', key: userId },
        }
      );
    },

    getAICostAnalytics: async (
      userId?: string,
      days: number = 30
    ): Promise<AsyncActionResult<{
      totalCost: number;
      costByAgent: Record<string, number>;
      requestCount: number;
      averageLatency: number;
      cacheEfficiency: number;
    }>> => {
      const cacheKey = `ai_cost_analytics_${userId || 'all'}_${days}`;
      
      return this.apiWrapper(
        async () => {
          const analytics = await aiOptimizer.getCostAnalytics(userId, days);
          
          // Get additional metrics
          const { data: interactions, error } = await this.supabase.mainClient
            .from('ai_interactions')
            .select('processing_time_ms, cache_hit')
            .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
            .then(result => {
              if (userId && !result.error) {
                return this.supabase.mainClient
                  .from('ai_interactions')
                  .select('processing_time_ms, cache_hit')
                  .eq('user_id', userId)
                  .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
              }
              return result;
            });

          if (error) throw error;

          const requestCount = interactions?.length || 0;
          const averageLatency = requestCount > 0 
            ? interactions!.reduce((sum, i) => sum + i.processing_time_ms, 0) / requestCount
            : 0;
          const cacheHits = interactions?.filter(i => i.cache_hit).length || 0;
          const cacheEfficiency = requestCount > 0 ? cacheHits / requestCount : 0;

          return {
            data: {
              ...analytics,
              requestCount,
              averageLatency,
              cacheEfficiency,
            },
            error: null,
          };
        },
        {
          endpoint: '/analytics/ai-cost',
          operation: 'get_ai_cost_analytics',
          userId,
          cacheKey,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
          rateLimit: { type: 'user', key: userId || 'global' },
        }
      );
    },
  };

  /**
   * Health check endpoint
   */
  health = {
    check: async (): Promise<AsyncActionResult<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      services: {
        database: boolean;
        cache: boolean;
        ai: boolean;
      };
      latency: {
        database: number;
        cache: number;
      };
      version: string;
    }>> => {
      return this.apiWrapper(
        async () => {
          const startTime = Date.now();
          
          // Test database connection
          const dbStart = Date.now();
          const { error: dbError } = await this.supabase.mainClient
            .from('profiles')
            .select('id')
            .limit(1);
          const dbLatency = Date.now() - dbStart;

          // Test cache
          const cacheStart = Date.now();
          const cacheStats = this.supabase.getCacheStats();
          const cacheLatency = Date.now() - cacheStart;

          // Test AI system
          const aiStats = aiOptimizer.getPerformanceStats();

          const services = {
            database: !dbError,
            cache: cacheStats.size >= 0,
            ai: aiStats.agents.length > 0,
          };

          const allHealthy = Object.values(services).every(Boolean);
          const status = allHealthy ? 'healthy' : 
                       services.database ? 'degraded' : 'unhealthy';

          return {
            data: {
              status,
              services,
              latency: {
                database: dbLatency,
                cache: cacheLatency,
              },
              version: '1.0.0', // Would come from package.json
            },
            error: null,
          };
        },
        {
          endpoint: '/health',
          operation: 'health_check',
          cacheKey: 'health_status',
          cacheTTL: 30 * 1000, // 30 seconds
        }
      );
    },
  };

  /**
   * Get API usage statistics
   */
  getUsageStats(): {
    rateLimits: Array<{
      type: string;
      key: string;
      remaining: number;
      resetTime: Date | null;
    }>;
    cacheStats: ReturnType<typeof this.supabase.getCacheStats>;
    performanceStats: ReturnType<typeof aiOptimizer.getPerformanceStats>;
  } {
    // This would typically aggregate data from the rate limiter
    // For now, return empty stats
    return {
      rateLimits: [],
      cacheStats: this.supabase.getCacheStats(),
      performanceStats: aiOptimizer.getPerformanceStats(),
    };
  }

  /**
   * Invalidate caches
   */
  async invalidateCache(pattern?: string): Promise<void> {
    this.supabase.invalidateCache(pattern);
    
    // Could also clear Redis cache in production
    console.log(`Cache invalidated${pattern ? ` for pattern: ${pattern}` : ''}`);
  }
}

// Export singleton instance
export const enhancedAPI = new EnhancedAPI();

// Export for backward compatibility
export default enhancedAPI;