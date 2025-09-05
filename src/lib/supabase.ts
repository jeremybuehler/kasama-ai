import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { apiRouteManager } from './api-route-manager'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced Supabase client with AI route integration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
})

// Register Supabase-related routes for intelligent caching and monitoring
apiRouteManager.registerRoute('supabase.auth.session', {
  url: '/auth/v1/token',
  method: 'GET',
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    strategy: 'time-based'
  },
  rateLimit: {
    enabled: true,
    maxRequests: 10,
    window: 60000
  }
})

apiRouteManager.registerRoute('supabase.user.profile', {
  url: '/rest/v1/user_profiles',
  method: 'GET',
  cache: {
    enabled: true,
    ttl: 600000, // 10 minutes
    strategy: 'intelligent'
  },
  aiOptimization: {
    enabled: true,
    adaptiveTimeouts: true,
    intelligentCaching: true
  }
})

apiRouteManager.registerRoute('supabase.user.progress', {
  url: '/rest/v1/user_progress',
  method: 'GET',
  cache: {
    enabled: true,
    ttl: 180000, // 3 minutes
    strategy: 'contextual'
  },
  realtime: {
    enabled: true,
    channel: 'user_progress_updates'
  }
})

// Real-time subscription manager with AI optimization
export class SupabaseRealtimeManager {
  private static instance: SupabaseRealtimeManager
  private channels: Map<string, any> = new Map()
  private subscriptionMetrics: Map<string, any> = new Map()

  static getInstance(): SupabaseRealtimeManager {
    if (!SupabaseRealtimeManager.instance) {
      SupabaseRealtimeManager.instance = new SupabaseRealtimeManager()
    }
    return SupabaseRealtimeManager.instance
  }

  subscribeToUserUpdates(userId: string, callback: (payload: any) => void) {
    const channelName = `user_${userId}_updates`
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          this.updateMetrics(channelName, 'profile_update')
          callback(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.updateMetrics(channelName, 'progress_update')
          callback(payload)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.subscriptionMetrics.set(channelName, {
      createdAt: new Date(),
      messageCount: 0,
      lastActivity: new Date()
    })

    return channel
  }

  subscribeToAIInsights(userId: string, callback: (payload: any) => void) {
    const channelName = `ai_insights_${userId}`
    
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'ai_insight_generated' }, callback)
      .on('broadcast', { event: 'learning_path_updated' }, callback)
      .on('broadcast', { event: 'progress_milestone_reached' }, callback)
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)
      this.subscriptionMetrics.delete(channelName)
    }
  }

  private updateMetrics(channelName: string, eventType: string) {
    const metrics = this.subscriptionMetrics.get(channelName)
    if (metrics) {
      metrics.messageCount++
      metrics.lastActivity = new Date()
      metrics.lastEventType = eventType
    }
  }

  getSubscriptionMetrics() {
    return Array.from(this.subscriptionMetrics.entries()).map(([channel, metrics]) => ({
      channel,
      ...metrics
    }))
  }
}

export const realtimeManager = SupabaseRealtimeManager.getInstance()
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Helper functions for common operations
export const authHelpers = {
  signUp: async (email: string, password: string, metadata?: any) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signInWithOAuth: async (provider: 'google' | 'github' | 'discord', redirectTo?: string) => {
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/dashboard`
      }
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  resetPassword: async (email: string, redirectTo?: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/reset-password`
    });
  },

  updatePassword: async (password: string) => {
    return await supabase.auth.updateUser({ password });
  },

  updateProfile: async (updates: any) => {
    return await supabase.auth.updateUser({ data: updates });
  },

  getCurrentSession: async () => {
    return await supabase.auth.getSession();
  },

  getCurrentUser: async () => {
    return await supabase.auth.getUser();
  }
};

export default supabase;