import { createClient } from '@supabase/supabase-js';

// Access environment variables (Works in Next.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client
// Note: In this demo environment, if keys are missing, this will be null.
// The AuthContext handles the fallback to mock mode.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
