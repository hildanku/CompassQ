import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
    clearOidcStateCookies,
    exchangeCodeForTokens,
    getOidcStateCookies,
    getQfOidcConfig,
    setQfTokenCookies,
} from '@/lib/qf/oidc'

export async function GET(request: Request) {
    const config = getQfOidcConfig()

    if (!config) {
        return NextResponse.json(
            { error: 'QF OIDC is not configured' },
            { status: 503 },
        )
    }

    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const state = requestUrl.searchParams.get('state')
    const error = requestUrl.searchParams.get('error')

    // Handle OAuth error (user denied, etc.)
    if (error) {
        const description =
            requestUrl.searchParams.get('error_description') ?? error
        return NextResponse.redirect(
            new URL(
                `/profile?qf_error=${encodeURIComponent(description)}`,
                requestUrl.origin,
            ),
        )
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/profile?qf_error=missing_params', requestUrl.origin),
        )
    }

    const cookieStore = await cookies()
    const { state: storedState, codeVerifier } =
        getOidcStateCookies(cookieStore)

    // Validate state to prevent CSRF
    if (!storedState || storedState !== state) {
        return NextResponse.redirect(
            new URL('/profile?qf_error=state_mismatch', requestUrl.origin),
        )
    }

    if (!codeVerifier) {
        return NextResponse.redirect(
            new URL('/profile?qf_error=missing_verifier', requestUrl.origin),
        )
    }

    try {
        const tokens = await exchangeCodeForTokens(code, codeVerifier)

        // Store tokens in httpOnly cookies
        setQfTokenCookies(cookieStore, tokens)

        // Clean up OIDC state cookies
        clearOidcStateCookies(cookieStore)

        // Redirect to original destination
        const next = cookieStore.get('qf_redirect_next')?.value ?? '/profile'
        cookieStore.delete('qf_redirect_next')

        return NextResponse.redirect(
            new URL(`${next}?qf=connected`, requestUrl.origin),
        )
    } catch (err) {
        console.error(
            '[qf-oidc] Token exchange failed:',
            err instanceof Error ? err.message : err,
        )

        clearOidcStateCookies(cookieStore)

        return NextResponse.redirect(
            new URL('/profile?qf_error=token_exchange_failed', requestUrl.origin),
        )
    }
}
