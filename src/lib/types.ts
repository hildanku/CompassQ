import type { SupabaseClient } from '@supabase/supabase-js'

export type ServiceContext = {
    supabase: SupabaseClient
    userId: string
}
