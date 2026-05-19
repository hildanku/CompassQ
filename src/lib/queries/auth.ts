import type { SupabaseClient } from '@supabase/supabase-js'

import { getSafeRedirect } from '@/lib/utils'

export type OAuthProvider = 'google' | 'github'

export async function signInWithMagicLink(
    supabase: SupabaseClient,
    email: string,
    next: string,
) {
    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('next', getSafeRedirect(next))

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: redirectTo.toString(),
            data: {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        },
    })

    if (error) {
        throw error
    }

    return 'Magic link sent. Check your inbox to continue.'
}

export async function signInWithOAuth(
    supabase: SupabaseClient,
    provider: OAuthProvider,
    next: string,
) {
    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('next', getSafeRedirect(next))

    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectTo.toString(),
        },
    })

    if (error) {
        throw error
    }
}
