import { NextResponse } from 'next/server'

import { ensureProfile } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function getSafeRedirect(next: string | null) {
    if (!next || !next.startsWith('/')) {
        return '/'
    }

    return next
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = getSafeRedirect(requestUrl.searchParams.get('next'))

    if (!code) {
        return NextResponse.redirect(new URL('/login', requestUrl.origin))
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        return NextResponse.redirect(
            new URL('/login?error=auth_callback_failed', requestUrl.origin),
        )
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        await ensureProfile(supabase, user)
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin))
}
