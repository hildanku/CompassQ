import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getSupabaseEnv } from '@/lib/supabase/env'

export async function createServerSupabaseClient() {
    const cookieStore = await cookies()
    const { url, publishableKey } = getSupabaseEnv()

    return createServerClient(url, publishableKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    for (const cookie of cookiesToSet) {
                        cookieStore.set(
                            cookie.name,
                            cookie.value,
                            cookie.options,
                        )
                    }
                } catch {
                    // Server Components cannot always mutate cookies.
                }
            },
        },
    })
}
