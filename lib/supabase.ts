import { createClient } from '@supabase/supabase-js';

type RuntimeConfig = { supabaseUrl?: string; supabaseAnonKey?: string };
const runtimeConfig = typeof window !== 'undefined'
  ? (window as Window & { __TMM_CONFIG__?: RuntimeConfig }).__TMM_CONFIG__
  : undefined;
const url = runtimeConfig ? runtimeConfig.supabaseUrl : process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = runtimeConfig ? runtimeConfig.supabaseAnonKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR_PROJECT'));
export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
