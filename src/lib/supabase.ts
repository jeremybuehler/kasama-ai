import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
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