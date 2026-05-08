import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/supabase-env';

// Server-side client with service role — bypasses RLS.
// Only use in API routes and server components.
export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  getSupabaseServiceRoleKey(),
);
