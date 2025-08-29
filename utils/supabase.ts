import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export type Guest = {
  id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
  address?: string
  misc?: string
  group_id?: string
  preferred_language?: string
  created_at: string
  updated_at: string
}

export type Group = {
  id: string
  name: string
  password: string
  misc?: string
  created_at: string
  updated_at: string
}