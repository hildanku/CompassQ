import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseEnv } from '@/lib/supabase/env'

function isMissingSessionError(
    error: { name?: string; message?: string } | null,
) {
    if (!error) {
        return false
    }

    return (
        error.name === 'AuthSessionMissingError' ||
        error.message === 'Auth session missing!'
    )
}

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return response
    }

    const { url, publishableKey } = getSupabaseEnv()
    const supabase = createServerClient(url, publishableKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                for (const cookie of cookiesToSet) {
                    request.cookies.set(cookie.name, cookie.value)
                }

                response = NextResponse.next({ request })

                for (const cookie of cookiesToSet) {
                    response.cookies.set(
                        cookie.name,
                        cookie.value,
                        cookie.options,
                    )
                }
            },
        },
    })

    const { error } = await supabase.auth.getUser()

    if (error && !isMissingSessionError(error)) {
        throw error
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
