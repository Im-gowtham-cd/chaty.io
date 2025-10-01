import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

// Use provided project URL; require anon key via env
const supabaseUrl = 'https://czuwlhshtmsncwyhnsnl.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  throw new Error('Missing Supabase anon key (VITE_SUPABASE_ANON_KEY)')
}

// Avoid multiple clients during Vite HMR by caching on globalThis
const getOrCreateClient = () => {
  const g = globalThis as any
  if (!g.__supabase_chatyio_client) {
    g.__supabase_chatyio_client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-chatyio-auth'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
  return g.__supabase_chatyio_client as ReturnType<typeof createClient<Database>>
}

export const supabase = getOrCreateClient()