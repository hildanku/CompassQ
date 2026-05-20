/**
 * Quran Foundation Content API integration.
 * Fetches verse text, translations, tafsir, and audio from QF Content API.
 */

import type {
    QfContentConfig,
    QfEnvironment,
    QfTokenCache,
    QfVerseResponse,
    CachedAyahReference,
    QfAyahPayload,
} from './types'
import {
    QF_OAUTH_BASE_URLS,
    QF_CONTENT_API_BASE_URLS,
    QF_CONTENT_DEFAULTS,
} from './constants'
import {
    createBasicAuth,
    parseAyahKey,
    sleep,
    stripHtml,
    toTafsirSnippet,
    getAbsoluteAudioUrl,
} from './utils'

// Config

let tokenCache: QfTokenCache | null = null

function readQfContentConfig(): QfContentConfig | null {
    const clientId = process.env.QF_CONTENT_CLIENT_ID?.trim()
    const clientSecret = process.env.QF_CONTENT_CLIENT_SECRET?.trim()
    const environment: QfEnvironment =
        process.env.QF_CONTENT_ENV === 'prelive' ? 'prelive' : 'production'

    if (!clientId || !clientSecret) {
        return null
    }

    return {
        clientId,
        clientSecret,
        environment,
        authBaseUrl: QF_OAUTH_BASE_URLS[environment],
        apiBaseUrl: QF_CONTENT_API_BASE_URLS[environment],
        translationResourceId:
            Number.parseInt(
                process.env.QF_CONTENT_TRANSLATION_RESOURCE_ID ?? '',
                10,
            ) || QF_CONTENT_DEFAULTS.translationResourceId,
        tafsirResourceId:
            Number.parseInt(
                process.env.QF_CONTENT_TAFSIR_RESOURCE_ID ?? '',
                10,
            ) || QF_CONTENT_DEFAULTS.tafsirResourceId,
        recitationId:
            Number.parseInt(process.env.QF_CONTENT_RECITATION_ID ?? '', 10) ||
            QF_CONTENT_DEFAULTS.recitationId,
    }
}

export function getQfContentConfig() {
    const config = readQfContentConfig()

    if (!config) {
        throw new Error(
            'Quran Foundation content env is missing. Set QF_CONTENT_CLIENT_ID and QF_CONTENT_CLIENT_SECRET.',
        )
    }

    return config
}

// Token
async function fetchQfContentToken(forceRefresh = false) {
    const config = getQfContentConfig()

    if (
        !forceRefresh &&
        tokenCache &&
        tokenCache.expiresAt > Date.now() + 60_000
    ) {
        return tokenCache.accessToken
    }

    const basicAuth = createBasicAuth(config.clientId, config.clientSecret)

    const response = await fetch(`${config.authBaseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'content',
        }),
    })

    if (!response.ok) {
        throw new Error(
            `QF token request failed with status ${response.status}`,
        )
    }

    const payload = (await response.json()) as {
        access_token?: string
        expires_in?: number
    }

    if (!payload.access_token || !payload.expires_in) {
        throw new Error('QF token response is incomplete')
    }

    tokenCache = {
        accessToken: payload.access_token,
        expiresAt: Date.now() + payload.expires_in * 1000,
    }

    return payload.access_token
}

// Fetch
async function qfFetch(path: string, query: URLSearchParams) {
    const config = getQfContentConfig()
    let token = await fetchQfContentToken()
    let refreshedAfterUnauthorized = false

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(`${config.apiBaseUrl}${path}?${query}`, {
            headers: {
                'x-auth-token': token,
                'x-client-id': config.clientId,
            },
            cache: 'no-store',
        })

        if (response.ok) {
            return response
        }

        if (response.status === 401 && !refreshedAfterUnauthorized) {
            token = await fetchQfContentToken(true)
            refreshedAfterUnauthorized = true
            continue
        }

        if ([429, 502, 503, 504].includes(response.status) && attempt < 2) {
            await sleep(150 * (attempt + 1) + Math.floor(Math.random() * 120))
            continue
        }

        throw new Error(
            `QF content request failed with status ${response.status}`,
        )
    }

    throw new Error('QF content request failed after retries')
}

// Public API
function hasMinimumCachedContent(reference: CachedAyahReference | null) {
    return Boolean(reference?.arabic_text && reference.translation_text)
}

export function getCachedAyahPayload(reference: CachedAyahReference | null) {
    if (!hasMinimumCachedContent(reference)) {
        return null
    }

    if (!reference) {
        return null
    }

    const cachedReference = reference

    return {
        ayahKey: cachedReference.ayah_key,
        surahNumber: cachedReference.surah_number,
        ayahNumber: cachedReference.ayah_number,
        arabicText: cachedReference.arabic_text ?? '',
        translation: cachedReference.translation_text ?? '',
        tafsirSnippet: cachedReference.tafsir_snippet ?? '',
        audioUrl: cachedReference.audio_url ?? '',
    } satisfies QfAyahPayload
}

export async function fetchQfAyahByKey(ayahKey: string) {
    const config = getQfContentConfig()
    const query = new URLSearchParams({
        translations: String(config.translationResourceId),
        tafsirs: String(config.tafsirResourceId),
        audio: String(config.recitationId),
        fields: 'text_uthmani',
    })

    const response = await qfFetch(
        `/verses/by_key/${encodeURIComponent(ayahKey)}`,
        query,
    )
    const payload = (await response.json()) as QfVerseResponse
    const verse = payload.verse
    const normalizedAyahKey = verse?.verse_key ?? ayahKey
    const parsedAyahKey = parseAyahKey(normalizedAyahKey)

    if (!verse?.verse_key || !verse.verse_number || !verse.text_uthmani) {
        throw new Error(`QF verse payload is incomplete for ${ayahKey}`)
    }

    const translation = stripHtml(verse.translations?.[0]?.text)

    if (!translation) {
        throw new Error(`QF translation payload is missing for ${ayahKey}`)
    }

    return {
        ayahKey: verse.verse_key,
        surahNumber: verse.chapter_id ?? parsedAyahKey.surahNumber,
        ayahNumber: verse.verse_number ?? parsedAyahKey.ayahNumber,
        arabicText: verse.text_uthmani,
        translation,
        tafsirSnippet: toTafsirSnippet(verse.tafsirs?.[0]?.text),
        audioUrl: getAbsoluteAudioUrl(verse.audio?.url),
    } satisfies QfAyahPayload
}
