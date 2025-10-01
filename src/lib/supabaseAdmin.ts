import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = 'https://czuwlhshtmsncwyhnsnl.supabase.co'
// Service role key must be provided at build time via Vite env
// Note: In the browser, never expose service role. Use only for local dev or secure server-side.
const supabaseServiceKey = (import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  throw new Error('Missing Supabase service role key (VITE_SUPABASE_SERVICE_ROLE_KEY)')
}

// Create Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})