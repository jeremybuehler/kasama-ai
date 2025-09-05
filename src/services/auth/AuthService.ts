/**
 * Enhanced Authentication Service with AI Integration
 * Production-ready authentication with intelligent session management and user profiling
 */

import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, realtimeManager } from '../../lib/supabase'
import { apiRouteManager } from '../../lib/api-route-manager'
import { AIOrchestrator } from '../ai/orchestrator'

export interface UserProfile {
  id: string
  email: string
  subscriptionTier: 'free' | 'premium' | 'professional'
  preferences: {
    communicationStyle: 'supportive' | 'analytical' | 'direct' | 'formal'
    aiPersonality: 'encouraging' | 'analytical' | 'direct' | 'gentle'
    learningPace: 'slow' | 'moderate' | 'fast'
  }
  onboardingCompleted: boolean
  createdAt: string
  lastActiveAt: string
  aiContext?: {
    userId: string
    subscriptionTier: string
    preferences: any
    learningHistory: any[]
    currentGoals: string[]
  }
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
  initialized: boolean
}

export class AuthService {
  private static instance: AuthService
  private orchestrator: AIOrchestrator
  private authState: AuthState = {
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
    initialized: false
  }
  private listeners: Set<(state: AuthState) => void> = new Set()
  private sessionRefreshTimer: NodeJS.Timeout | null = null

  private constructor() {
    this.orchestrator = new AIOrchestrator()
    this.initializeAuth()
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }

      if (session?.user) {
        await this.handleAuthSuccess(session.user, session)
      } else {
        this.updateAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null,
          initialized: true
        })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              await this.handleAuthSuccess(session.user, session)
            }
            break
          case 'SIGNED_OUT':
            await this.handleSignOut()
            break
          case 'TOKEN_REFRESHED':
            if (session) {
              this.updateAuthState({
                ...this.authState,
                session,
                error: null
              })
            }
            break
          case 'USER_UPDATED':
            if (session?.user) {
              await this.refreshUserProfile(session.user.id)
            }
            break
        }
      })

    } catch (error) {
      console.error('Auth initialization failed:', error)
      this.updateAuthState({
        ...this.authState,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        initialized: true
      })
    }
  }

  private async handleAuthSuccess(user: User, session: Session) {
    try {
      // Fetch user profile
      const profile = await this.fetchUserProfile(user.id)
      
      // Initialize AI context
      const aiContext = await this.initializeAIContext(user.id, profile)
      
      // Set up real-time subscriptions
      realtimeManager.subscribeToUserUpdates(user.id, this.handleRealtimeUpdate.bind(this))
      
      // Update auth state
      this.updateAuthState({
        user,
        profile: { ...profile, aiContext },
        session,
        loading: false,
        error: null,
        initialized: true
      })

      // Setup session refresh
      this.setupSessionRefresh(session)

      // Track authentication analytics
      await this.trackAuthEvent('sign_in', user.id)

    } catch (error) {
      console.error('Auth success handling failed:', error)
      this.updateAuthState({
        user,
        profile: null,
        session,
        loading: false,
        error: error instanceof Error ? error.message : 'Profile loading failed',
        initialized: true
      })
    }
  }

  private async handleSignOut() {
    try {
      // Clear timers
      if (this.sessionRefreshTimer) {
        clearTimeout(this.sessionRefreshTimer)
        this.sessionRefreshTimer = null
      }

      // Unsubscribe from real-time updates
      realtimeManager.getSubscriptionMetrics().forEach(({ channel }) => {
        realtimeManager.unsubscribe(channel)
      })

      // Clear local storage
      localStorage.removeItem('user_id')
      localStorage.removeItem('ai_context')
      
      // Update state
      this.updateAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
        initialized: true
      })

    } catch (error) {
      console.error('Sign out handling failed:', error)
    }
  }

  private async fetchUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await apiRouteManager.request('supabase.user.profile', {
        select: '*',
        eq: { id: userId },
        single: true
      })

      if (!response.data) {
        // Create default profile for new users
        return await this.createDefaultProfile(userId)
      }

      return response.data
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      throw error
    }
  }

  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    const { data: user } = await supabase.auth.getUser()
    
    const defaultProfile: Partial<UserProfile> = {
      id: userId,
      email: user.user?.email || '',
      subscriptionTier: 'free',
      preferences: {
        communicationStyle: 'supportive',
        aiPersonality: 'encouraging',
        learningPace: 'moderate'
      },
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([defaultProfile])
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  private async initializeAIContext(userId: string, profile: UserProfile) {
    try {
      const aiContext = {
        userId,
        subscriptionTier: profile.subscriptionTier,
        preferences: profile.preferences,
        learningHistory: [],
        currentGoals: []
      }

      // Store in localStorage for quick access
      localStorage.setItem('user_id', userId)
      localStorage.setItem('ai_context', JSON.stringify(aiContext))

      return aiContext
    } catch (error) {
      console.error('Failed to initialize AI context:', error)
      return undefined
    }
  }

  private setupSessionRefresh(session: Session) {
    if (this.sessionRefreshTimer) {
      clearTimeout(this.sessionRefreshTimer)
    }

    // Refresh 5 minutes before expiry
    const expiresAt = session.expires_at
    if (expiresAt) {
      const refreshTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000)
      
      if (refreshTime > 0) {
        this.sessionRefreshTimer = setTimeout(async () => {
          try {
            await supabase.auth.refreshSession()
          } catch (error) {
            console.error('Session refresh failed:', error)
          }
        }, refreshTime)
      }
    }
  }

  private handleRealtimeUpdate(payload: any) {
    if (payload.eventType === 'UPDATE' && payload.table === 'user_profiles') {
      // Update profile in auth state
      this.updateAuthState({
        ...this.authState,
        profile: {
          ...this.authState.profile!,
          ...payload.new
        }
      })
    }
  }

  private async refreshUserProfile(userId: string) {
    try {
      const profile = await this.fetchUserProfile(userId)
      this.updateAuthState({
        ...this.authState,
        profile
      })
    } catch (error) {
      console.error('Failed to refresh user profile:', error)
    }
  }

  private async trackAuthEvent(event: string, userId: string) {
    try {
      await apiRouteManager.request('analytics.track', {
        event: `auth_${event}`,
        userId,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.warn('Failed to track auth event:', error)
    }
  }

  private updateAuthState(newState: Partial<AuthState>) {
    this.authState = { ...this.authState, ...newState }
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState)
      } catch (error) {
        console.error('Auth state listener error:', error)
      }
    })
  }

  // Public API methods
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.updateAuthState({ ...this.authState, loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (error) {
        throw error
      }

      await this.trackAuthEvent('sign_in_success', data.user?.id || 'unknown')

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      this.updateAuthState({ 
        ...this.authState, 
        loading: false, 
        error: errorMessage 
      })

      await this.trackAuthEvent('sign_in_failure', 'unknown')
      
      return { success: false, error: errorMessage }
    }
  }

  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.updateAuthState({ ...this.authState, loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      if (data.user) {
        await this.trackAuthEvent('sign_up_success', data.user.id)
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      this.updateAuthState({ 
        ...this.authState, 
        loading: false, 
        error: errorMessage 
      })

      await this.trackAuthEvent('sign_up_failure', 'unknown')
      
      return { success: false, error: errorMessage }
    }
  }

  async signOut(): Promise<void> {
    this.updateAuthState({ ...this.authState, loading: true })

    try {
      const userId = this.authState.user?.id
      if (userId) {
        await this.trackAuthEvent('sign_out', userId)
      }

      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
      this.updateAuthState({ ...this.authState, loading: false })
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    if (!this.authState.user || !this.authState.profile) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', this.authState.user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Update AI context if preferences changed
      if (updates.preferences || updates.subscriptionTier) {
        const aiContext = await this.initializeAIContext(this.authState.user.id, {
          ...this.authState.profile,
          ...updates
        })
        
        this.updateAuthState({
          ...this.authState,
          profile: { ...this.authState.profile, ...data, aiContext }
        })
      } else {
        this.updateAuthState({
          ...this.authState,
          profile: { ...this.authState.profile, ...data }
        })
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
      return { success: false, error: errorMessage }
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw error
      }

      await this.trackAuthEvent('password_reset_request', 'unknown')
      
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
      return { success: false, error: errorMessage }
    }
  }

  // State management
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)
    
    // Immediately call with current state
    listener(this.authState)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!(this.authState.user && this.authState.session)
  }

  requiresOnboarding(): boolean {
    return !this.authState.profile?.onboardingCompleted
  }

  hasSubscription(tier: 'premium' | 'professional'): boolean {
    if (!this.authState.profile) return false
    
    const tiers = ['free', 'premium', 'professional']
    const userTierIndex = tiers.indexOf(this.authState.profile.subscriptionTier)
    const requiredTierIndex = tiers.indexOf(tier)
    
    return userTierIndex >= requiredTierIndex
  }
}

export const authService = AuthService.getInstance()
