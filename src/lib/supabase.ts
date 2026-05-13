import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder'

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
