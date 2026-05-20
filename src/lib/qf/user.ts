/**
 * Quran Foundation User API integration (hybrid approach).
 *
 * Strategy:
 * 1. If user has connected QF account via OIDC → use their token (full functionality)
 * 2. Fallback to client_credentials with scope=bookmark → demonstrates integration
 *    (auth succeeds, payload valid, but QF prelive returns 500 due to no user context)
 *
 * Both paths are fire-and-forget - Supabase remains the source of truth.
 */

import { getQfAccessToken, getQfOidcConfig } from '@/lib/qf/oidc'
import type { QfTokenCache } from './types'
import { createBasicAuth, parseAyahKey, sleep } from './utils'

let ccTokenCache: QfTokenCache | null = null

async function fetchClientCredentialsToken(): Promise<string | null> {
    const config = getQfOidcConfig()

    if (!config) {
        return null
    }

    if (ccTokenCache && ccTokenCache.expiresAt > Date.now() + 60_000) {
        return ccTokenCache.accessToken
    }

    const basicAuth = createBasicAuth(config.clientId, config.clientSecret)

    try {
        const response = await fetch(`${config.oauthBaseUrl}/oauth2/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                scope: 'bookmark',
            }),
        })

        if (!response.ok) {
            return null
        }

        const payload = (await response.json()) as {
            access_token?: string
            expires_in?: number
        }

        if (!payload.access_token || !payload.expires_in) {
            return null
        }

        ccTokenCache = {
            accessToken: payload.access_token,
            expiresAt: Date.now() + payload.expires_in * 1000,
        }

        return payload.access_token
    } catch {
        return null
    }
}

type TokenSource = 'oidc' | 'client_credentials' | null

async function resolveQfToken(): Promise<{
    token: string | null
    source: TokenSource
}> {
    // Priority 1: OIDC user token (from cookie)
    const oidcToken = await getQfAccessToken()
    if (oidcToken) {
        return { token: oidcToken, source: 'oidc' }
    }

    // Priority 2: Client credentials fallback
    const ccToken = await fetchClientCredentialsToken()
    if (ccToken) {
        return { token: ccToken, source: 'client_credentials' }
    }

    return { token: null, source: null }
}

async function qfUserFetch(
    method: 'POST' | 'DELETE' | 'GET',
    path: string,
    body?: Record<string, unknown>,
): Promise<{ response: Response | null; source: TokenSource }> {
    const config = getQfOidcConfig()

    if (!config) {
        return { response: null, source: null }
    }

    const { token, source } = await resolveQfToken()

    if (!token) {
        return { response: null, source: null }
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const headers: Record<string, string> = {
            'x-auth-token': token,
            'x-client-id': config.clientId,
        }

        if (body) {
            headers['Content-Type'] = 'application/json'
        }

        const response = await fetch(`${config.apiBaseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        })

        if (response.ok) {
            return { response, source }
        }

        // For client_credentials, 500 is expected (no user context) — return it
        if (source === 'client_credentials' && response.status === 500) {
            return { response, source }
        }

        // Don't retry on auth errors
        if (response.status === 401 || response.status === 403) {
            return { response, source }
        }

        if ([429, 502, 503, 504].includes(response.status) && attempt < 2) {
            await sleep(150 * (attempt + 1) + Math.floor(Math.random() * 120))
            continue
        }

        return { response, source }
    }

    return { response: null, source }
}

/**
 * Sync a bookmark creation to QF User API.
 * Fire-and-forget - logs results but never throws to the caller.
 */
export async function syncBookmarkToQf(ayahKey: string): Promise<void> {
    try {
        const { surahNumber, ayahNumber } = parseAyahKey(ayahKey)

        const { response, source } = await qfUserFetch('POST', '/v1/bookmarks', {
            key: surahNumber,
            type: 'ayah',
            verseNumber: ayahNumber,
            mushafId: 1,
        })

        if (!response) {
            return
        }

        if (response.ok) {
            const data = (await response.json()) as { success?: boolean }
            console.info(
                `[qf-user] Bookmark synced to QF (${source}):`,
                ayahKey,
                '→',
                data.success ?? 'ok',
            )
        } else if (source === 'client_credentials' && response.status === 500) {
            console.info(
                `[qf-user] Bookmark sync attempted (${source}):`,
                ayahKey,
                '— QF returned 500 (no user context, awaiting OIDC approval)',
            )
        } else {
            console.warn(
                `[qf-user] Bookmark sync returned ${response.status} (${source}) for`,
                ayahKey,
            )
        }
    } catch (error) {
        console.error(
            '[qf-user] Failed to sync bookmark creation to QF:',
            error instanceof Error ? error.message : error,
        )
    }
}

/**
 * Sync a bookmark removal to QF User API.
 * Fire-and-forget — logs results but never throws to the caller.
 */
export async function syncBookmarkRemovalToQf(ayahKey: string): Promise<void> {
    try {
        const { surahNumber, ayahNumber } = parseAyahKey(ayahKey)

        const { response, source } = await qfUserFetch(
            'DELETE',
            '/v1/collections/__default__/bookmarks',
            {
                key: surahNumber,
                type: 'ayah',
                verseNumber: ayahNumber,
                mushafId: 1,
            },
        )

        if (!response) {
            return
        }

        if (response.ok) {
            const data = (await response.json()) as { success?: boolean }
            console.info(
                `[qf-user] Bookmark removal synced to QF (${source}):`,
                ayahKey,
                '→',
                data.success ?? 'ok',
            )
        } else if (source === 'client_credentials' && response.status === 500) {
            console.info(
                `[qf-user] Bookmark removal attempted (${source}):`,
                ayahKey,
                '— QF returned 500 (no user context, awaiting OIDC approval)',
            )
        } else {
            console.warn(
                `[qf-user] Bookmark removal returned ${response.status} (${source}) for`,
                ayahKey,
            )
        }
    } catch (error) {
        console.error(
            '[qf-user] Failed to sync bookmark removal to QF:',
            error instanceof Error ? error.message : error,
        )
    }
}
