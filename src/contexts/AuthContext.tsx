/**
 * Enhanced Authentication Context with AI Integration
 * Provides user authentication state with AI-powered personalization context
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { apiRequest, apiRouteManager } from '../lib/api-route-manager';
import { aiComponentFactory } from '../lib/ai-component-factory';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  subscriptionTier: 'free' | 'premium' | 'professional';
  preferences?: {
    communicationStyle?: 'formal' | 'casual' | 'supportive';
    aiPersonality?: 'encouraging' | 'direct' | 'analytical';
    notificationFrequency?: 'immediate' | 'daily' | 'weekly';
    learningPace?: 'slow' | 'moderate' | 'fast';
  };
  onboardingCompleted?: boolean;
  lastActiveAt?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<{ user: User | null; error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ profile: UserProfile | null; error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  isPremium: boolean;
  isProfessional: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    initialized: false
  });

  // Initialize auth state and set up listeners
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setState(prev => ({ ...prev, loading: false, initialized: true }));
          }
          return;
        }

        if (session?.user && mounted) {
          await updateAuthState(session.user, session);
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false, initialized: true }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, initialized: true }));
        }
      }
    };

    const updateAuthState = async (user: User, session: Session) => {
      try {
        // Fetch user profile
        const profile = await fetchUserProfile(user.id);
        
        if (mounted) {
          setState({
            user,
            profile,
            session,
            loading: false,
            initialized: true
          });

          // Initialize AI personalization context
          if (profile) {
            await initializeAIContext(profile);
          }

          // Update last active timestamp
          await updateLastActive(user.id);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        if (mounted) {
          setState({
            user,
            profile: null,
            session,
            loading: false,
            initialized: true
          });
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user && mounted) {
        await updateAuthState(session.user, session);
        toast.success('Welcome back!');
      } else if (event === 'SIGNED_OUT' && mounted) {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          initialized: true
        });
        // Clear AI context
        localStorage.removeItem('ai_context');
        localStorage.removeItem('user_preferences');
        toast.success('Signed out successfully');
      } else if (event === 'TOKEN_REFRESHED' && session && mounted) {
        setState(prev => ({ ...prev, session }));
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatar: data.avatar,
        subscriptionTier: data.subscription_tier || 'free',
        preferences: data.preferences || {},
        onboardingCompleted: data.onboarding_completed || false,
        lastActiveAt: data.last_active_at,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const initializeAIContext = async (profile: UserProfile) => {
    try {
      // Cache user context for AI personalization
      const aiContext = {
        userId: profile.id,
        subscriptionTier: profile.subscriptionTier,
        preferences: profile.preferences,
        onboardingCompleted: profile.onboardingCompleted,
        deviceInfo: {
          isMobile: window.innerWidth < 768,
          connectionSpeed: 'unknown' as const,
          preferredTheme: 'light' as const
        }
      };
      
      localStorage.setItem('ai_context', JSON.stringify(aiContext));
      localStorage.setItem('user_id', profile.id);
      
      console.log('🤖 AI context initialized for user:', profile.id);
    } catch (error) {
      console.error('AI context initialization failed:', error);
    }
  };

  const updateLastActive = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    profileData: Partial<UserProfile>
  ): Promise<{ user: User | null; error: string | null }> => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName
          }
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            subscription_tier: 'free',
            preferences: {
              communicationStyle: 'supportive',
              aiPersonality: 'encouraging',
              notificationFrequency: 'daily',
              learningPace: 'moderate'
            },
            onboarding_completed: false,
            created_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        toast.success('Account created successfully! Please check your email for verification.');
        return { user: data.user, error: null };
      }

      return { user: null, error: 'Unknown error occurred' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      toast.error(errorMessage);
      return { user: null, error: errorMessage };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (
    email: string, 
    password: string
  ): Promise<{ user: User | null; error: string | null }> => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message);
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      toast.error(errorMessage);
      return { user: null, error: errorMessage };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        console.error('Sign out error:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ profile: UserProfile | null; error: string | null }> => {
    if (!state.user) {
      return { profile: null, error: 'No authenticated user' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          avatar: updates.avatar,
          preferences: updates.preferences,
          onboarding_completed: updates.onboardingCompleted
        })
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedProfile: UserProfile = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatar: data.avatar,
        subscriptionTier: data.subscription_tier,
        preferences: data.preferences,
        onboardingCompleted: data.onboarding_completed,
        lastActiveAt: data.last_active_at,
        createdAt: data.created_at
      };

      setState(prev => ({ ...prev, profile: updatedProfile }));
      
      // Update AI context with new preferences
      await initializeAIContext(updatedProfile);
      
      toast.success('Profile updated successfully');
      return { profile: updatedProfile, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(errorMessage);
      return { profile: null, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        toast.error(error.message);
        return { error: error.message };
      }

      toast.success('Password reset email sent');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        return;
      }

      if (data.session) {
        setState(prev => ({ ...prev, session: data.session }));
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    refreshSession,
    isAuthenticated: !!state.user && !!state.session,
    isPremium: state.profile?.subscriptionTier === 'premium',
    isProfessional: state.profile?.subscriptionTier === 'professional'
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
