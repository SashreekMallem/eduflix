import { createClient } from '@supabase/supabase-js';

// Supabase configuration with fallback values for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhrqvcmcchsguzjrvlth.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocnF2Y21jY2hzZ3V6anJ2bHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNDY4MTIsImV4cCI6MjA2NTYyMjgxMn0.ffuWi64kPZVEoaFqzXQAZwQwW1kt3S4iZu1C9rLUPns';

// Validate that we have the required values
if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
  throw new Error('Missing Supabase URL. Please check your environment variables.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key') {
  throw new Error('Missing Supabase Anon Key. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types for our database
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: object | null;
  session: object | null;
  error: Error | null;
}
