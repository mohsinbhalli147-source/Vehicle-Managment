import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lajcyndbhtawcbghqxct.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_7VnpI7wkElTzRzol4pCwpQ_918Gwdnf'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
