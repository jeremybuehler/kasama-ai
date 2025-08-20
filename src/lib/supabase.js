import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || supabaseUrl.includes('your-project')) {
  console.warn("VITE_SUPABASE_URL not properly configured - using mock client");
}
if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) {
  console.warn("VITE_SUPABASE_ANON_KEY not properly configured - using mock client");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
