type QfContentEnvironment = 'prelive' | 'production'

type QfContentConfig = {
    clientId: string
    clientSecret: string
    environment: QfContentEnvironment
    authBaseUrl: string
    apiBaseUrl: string
    translationResourceId: number
    tafsirResourceId: number
    recitationId: number
}

type QfTokenCache = {
    accessToken: string
    expiresAt: number
}

type QfVerseResponse = {
    verse?: {
        chapter_id?: number
        verse_number?: number
        verse_key?: string
        text_uthmani?: string
        audio?: {
            url?: string
        }
        translations?: Array<{
            text?: string
        }>
        tafsirs?: Array<{
            text?: string
        }>
    }
}

function parseAyahKey(ayahKey: string) {
    const [surahNumberText, ayahNumberText] = ayahKey.split(':')
    const surahNumber = Number.parseInt(surahNumberText ?? '', 10)
    const ayahNumber = Number.parseInt(ayahNumberText ?? '', 10)

    if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) {
        throw new Error(`Invalid ayah key: ${ayahKey}`)
    }

    return {
        surahNumber,
        ayahNumber,
    }
}

type CachedAyahReference = {
    ayah_key: string
    surah_number: number
    ayah_number: number
    arabic_text: string | null
    translation_text: string | null
    tafsir_snippet: string | null
    audio_url: string | null
}

type QfAyahPayload = {
    ayahKey: string
    surahNumber: number
    ayahNumber: number
    arabicText: string
    translation: string
    tafsirSnippet: string
    audioUrl: string
}

const qfContentAuthBaseUrls: Record<QfContentEnvironment, string> = {
    prelive: 'https://prelive-oauth2.quran.foundation',
    production: 'https://oauth2.quran.foundation',
}

const qfContentApiBaseUrls: Record<QfContentEnvironment, string> = {
    prelive: 'https://apis-prelive.quran.foundation/content/api/v4',
    production: 'https://apis.quran.foundation/content/api/v4',
}

const qfDefaultConfig = {
    translationResourceId: 131,
    tafsirResourceId: 169,
    recitationId: 1,
}

let tokenCache: QfTokenCache | null = null

function readQfContentConfig(): QfContentConfig | null {
    const clientId = process.env.QF_CONTENT_CLIENT_ID?.trim()
    const clientSecret = process.env.QF_CONTENT_CLIENT_SECRET?.trim()
    const environment =
        process.env.QF_CONTENT_ENV === 'prelive' ? 'prelive' : 'production'

    if (!clientId || !clientSecret) {
        return null
    }

    return {
        clientId,
        clientSecret,
        environment,
        authBaseUrl: qfContentAuthBaseUrls[environment],
        apiBaseUrl: qfContentApiBaseUrls[environment],
        translationResourceId:
            Number.parseInt(
                process.env.QF_CONTENT_TRANSLATION_RESOURCE_ID ?? '',
                10,
            ) || qfDefaultConfig.translationResourceId,
        tafsirResourceId:
            Number.parseInt(
                process.env.QF_CONTENT_TAFSIR_RESOURCE_ID ?? '',
                10,
            ) || qfDefaultConfig.tafsirResourceId,
        recitationId:
            Number.parseInt(process.env.QF_CONTENT_RECITATION_ID ?? '', 10) ||
            qfDefaultConfig.recitationId,
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

function stripHtml(value: string | undefined) {
    if (!value) {
        return ''
    }

    return value
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
}

function toTafsirSnippet(value: string | undefined) {
    const text = stripHtml(value)

    if (text.length <= 420) {
        return text
    }

    return `${text.slice(0, 417).trimEnd()}...`
}

function getAbsoluteAudioUrl(value: string | undefined) {
    if (!value) {
        return ''
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value
    }

    return `https://verses.quran.foundation/${value.replace(/^\/+/, '')}`
}

function sleep(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function fetchQfContentToken(forceRefresh = false) {
    const config = getQfContentConfig()

    if (
        !forceRefresh &&
        tokenCache &&
        tokenCache.expiresAt > Date.now() + 60_000
    ) {
        return tokenCache.accessToken
    }

    const basicAuth = Buffer.from(
        `${config.clientId}:${config.clientSecret}`,
    ).toString('base64')

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
