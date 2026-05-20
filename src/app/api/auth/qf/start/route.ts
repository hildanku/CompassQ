import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
    createPkceChallenge,
    generateRandomString,
    getQfOidcConfig,
    setOidcStateCookies,
} from '@/lib/qf/oidc'
import { getSafeRedirect } from '@/lib/utils'

export async function GET(request: Request) {
    const config = getQfOidcConfig()

    if (!config) {
        return NextResponse.json(
            { error: 'QF OIDC is not configured' },
            { status: 503 },
        )
    }

    const requestUrl = new URL(request.url)
    const next = getSafeRedirect(requestUrl.searchParams.get('next'))

    const state = generateRandomString(32)
    const codeVerifier = generateRandomString(43)
    const codeChallenge = await createPkceChallenge(codeVerifier)

    // Store PKCE verifier + state in httpOnly cookies
    const cookieStore = await cookies()
    setOidcStateCookies(cookieStore, state, codeVerifier)

    // Also store the redirect destination
    cookieStore.set('qf_redirect_next', next, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60,
    })

    // Build QF authorization URL
    const authUrl = new URL(`${config.oauthBaseUrl}/oauth2/auth`)
    authUrl.searchParams.set('client_id', config.clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', config.redirectUri)
    authUrl.searchParams.set('scope', config.scope)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return NextResponse.redirect(authUrl.toString())
}
