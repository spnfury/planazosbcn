import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase-env';

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
