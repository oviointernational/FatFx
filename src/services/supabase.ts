import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_URL = 'https://ttdlwciathljfhekhxvx.supabase.co';
const SUPABASE_ANON_PUBLIC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZGx3Y2lhdGhsamZoZWtoeHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDk2MzEsImV4cCI6MjEwMzgyNTYzMX0.xpqUUVhTDBl5R42qIXfhqjSjDRYNaHU89MpiH13qXy4';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_PUBLIC_KEY;

// Direct live Supabase connection status
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
