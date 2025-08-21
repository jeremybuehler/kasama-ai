import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase configuration
const hasValidConfig = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseAnonKey.includes('your-anon-key') &&
  supabaseUrl.startsWith('https://');

// Validate environment variables in production
if (import.meta.env.PROD && !hasValidConfig) {
  console.error('🚨 Critical: Supabase configuration missing in production');
  console.error('Environment variables required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('Current VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('Current VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

let supabase;

if (hasValidConfig) {
  // Create real Supabase client with valid configuration
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  if (import.meta.env.DEV) {
    console.log('✅ Supabase client initialized successfully');
  }
} else {
  // Create mock client for development/demo purposes
  if (import.meta.env.DEV) {
    console.warn('⚠️ Supabase not configured properly. Using mock client for development.');
    console.warn('To enable authentication, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  
  // Mock Supabase client that returns promises but doesn't actually work
  supabase = {
    auth: {
      signUp: () => Promise.resolve({ data: null, error: { message: 'Authentication not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Authentication not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'Authentication not configured' } }),
      updateUser: () => Promise.resolve({ data: null, error: { message: 'Authentication not configured' } }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => {
        // Return unsubscribe function
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } })
    })
  };
}

export { supabase };
