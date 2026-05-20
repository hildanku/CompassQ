/**
 * QF OIDC helpers - PKCE generation, config, and token exchange.
 * Follows the pattern proven by other hackathon participants (iamanahmad, muno459).
 */

import { cookies } from 'next/headers'

import type { QfEnvironment, QfOidcConfig, QfTokenResponse } from './types'
import { QF_OAUTH_BASE_URLS, QF_USER_API_BASE_URLS } from './constants'
import { createBasicAuth } from './utils'

// Config

export function getQfOidcConfig(): QfOidcConfig | null {
    const clientId = process.env.QF_USER_CLIENT_ID?.trim()
    const clientSecret = process.env.QF_USER_CLIENT_SECRET?.trim()

    if (!clientId || !clientSecret) {
        return null
    }

    const environment: QfEnvironment =
        process.env.QF_USER_ENV === 'production' ? 'production' : 'prelive'

    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3001')

    return {
        clientId,
        clientSecret,
        environment,
        oauthBaseUrl: QF_OAUTH_BASE_URLS[environment],
        apiBaseUrl: QF_USER_API_BASE_URLS[environment],
        redirectUri: `${appUrl}/api/auth/qf/callback`,
        scope: 'openid offline_access bookmark',
    }
}

//  PKCE

export function generateRandomString(length = 43): string {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return base64UrlEncode(bytes)
}

export async function createPkceChallenge(
    codeVerifier: string,
): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode(bytes: Uint8Array): string {
    let binary = ''
    for (const byte of bytes) {
        binary += String.fromCharCode(byte)
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Token Exchange

export async function exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
): Promise<QfTokenResponse> {
    const config = getQfOidcConfig()

    if (!config) {
        throw new Error('QF OIDC is not configured')
    }

    const basicAuth = createBasicAuth(config.clientId, config.clientSecret)

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier,
    })

    const response = await fetch(`${config.oauthBaseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
            `QF token exchange failed (${response.status}): ${errorText}`,
        )
    }

    return (await response.json()) as QfTokenResponse
}

export async function refreshAccessToken(
    refreshToken: string,
): Promise<QfTokenResponse> {
    const config = getQfOidcConfig()

    if (!config) {
        throw new Error('QF OIDC is not configured')
    }

    const basicAuth = createBasicAuth(config.clientId, config.clientSecret)

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    })

    const response = await fetch(`${config.oauthBaseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    })

    if (!response.ok) {
        throw new Error(`QF token refresh failed (${response.status})`)
    }

    return (await response.json()) as QfTokenResponse
}

// Cookie-based session

const QF_ACCESS_TOKEN_COOKIE = 'qf_access_token'
const QF_REFRESH_TOKEN_COOKIE = 'qf_refresh_token'
const QF_EXPIRES_AT_COOKIE = 'qf_token_expires_at'
const QF_PKCE_VERIFIER_COOKIE = 'qf_pkce_verifier'
const QF_STATE_COOKIE = 'qf_state'

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
}

export function setQfTokenCookies(
    cookieStore: Awaited<ReturnType<typeof cookies>>,
    tokens: QfTokenResponse,
) {
    const expiresAt = Date.now() + tokens.expires_in * 1000

    cookieStore.set(QF_ACCESS_TOKEN_COOKIE, tokens.access_token, {
        ...COOKIE_OPTIONS,
        maxAge: 14 * 24 * 60 * 60, // 14 days
    })

    if (tokens.refresh_token) {
        cookieStore.set(QF_REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
            ...COOKIE_OPTIONS,
            maxAge: 14 * 24 * 60 * 60,
        })
    }

    cookieStore.set(QF_EXPIRES_AT_COOKIE, String(expiresAt), {
        ...COOKIE_OPTIONS,
        maxAge: 14 * 24 * 60 * 60,
    })
}

export function clearQfTokenCookies(
    cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
    cookieStore.delete(QF_ACCESS_TOKEN_COOKIE)
    cookieStore.delete(QF_REFRESH_TOKEN_COOKIE)
    cookieStore.delete(QF_EXPIRES_AT_COOKIE)
}

export function setOidcStateCookies(
    cookieStore: Awaited<ReturnType<typeof cookies>>,
    state: string,
    codeVerifier: string,
) {
    cookieStore.set(QF_PKCE_VERIFIER_COOKIE, codeVerifier, {
        ...COOKIE_OPTIONS,
        maxAge: 10 * 60, // 10 minutes
    })

    cookieStore.set(QF_STATE_COOKIE, state, {
        ...COOKIE_OPTIONS,
        maxAge: 10 * 60,
    })
}

export function getOidcStateCookies(
    cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
    const state = cookieStore.get(QF_STATE_COOKIE)?.value
    const codeVerifier = cookieStore.get(QF_PKCE_VERIFIER_COOKIE)?.value

    return { state, codeVerifier }
}

export function clearOidcStateCookies(
    cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
    cookieStore.delete(QF_PKCE_VERIFIER_COOKIE)
    cookieStore.delete(QF_STATE_COOKIE)
}

/**
 * Get a usable QF access token from cookies (OIDC flow).
 * Auto-refreshes if within 60s of expiry.
 * Returns null if not connected.
 */
export async function getQfAccessToken(): Promise<string | null> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(QF_ACCESS_TOKEN_COOKIE)?.value
    const refreshToken = cookieStore.get(QF_REFRESH_TOKEN_COOKIE)?.value
    const expiresAtStr = cookieStore.get(QF_EXPIRES_AT_COOKIE)?.value

    if (!accessToken) {
        return null
    }

    const expiresAt = expiresAtStr ? Number(expiresAtStr) : 0
    const isNearExpiry = expiresAt > 0 && expiresAt - Date.now() < 60_000

    if (!isNearExpiry) {
        return accessToken
    }

    // Try refresh
    if (refreshToken) {
        try {
            const tokens = await refreshAccessToken(refreshToken)
            setQfTokenCookies(cookieStore, tokens)
            return tokens.access_token
        } catch {
            // Refresh failed - clear session
            clearQfTokenCookies(cookieStore)
            return null
        }
    }

    return accessToken
}
