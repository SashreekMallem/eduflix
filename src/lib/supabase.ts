import { createClient } from '@supabase/supabase-js';

// Supabase configuration with fallback values for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xymfscalouppymcdjtfc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bWZzY2Fsb3VwcHltY2RqdGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTEyNjMsImV4cCI6MjA3OTc4NzI2M30.E9wHd_xA3AvdgEyfQecqgIkrFZi8uFMIhmWDMFEGjZ4';

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