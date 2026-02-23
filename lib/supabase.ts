import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Client-side Supabase instance (for browser use)
// Uses the anon key which respects RLS policies
export const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side Supabase instance (for API routes and server components)
// Uses the service role key which bypasses RLS (use with caution!)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);