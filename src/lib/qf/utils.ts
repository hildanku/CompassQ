/**
 * Parse an ayah key string (e.g. "2:255") into surah and ayah numbers.
 */
export function parseAyahKey(ayahKey: string) {
    const [surahNumberText, ayahNumberText] = ayahKey.split(':')
    const surahNumber = Number.parseInt(surahNumberText ?? '', 10)
    const ayahNumber = Number.parseInt(ayahNumberText ?? '', 10)

    if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) {
        throw new Error(`Invalid ayah key: ${ayahKey}`)
    }

    return { surahNumber, ayahNumber }
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create a Basic Auth header value from client credentials.
 */
export function createBasicAuth(clientId: string, clientSecret: string): string {
    return Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

/**
 * Strip HTML tags and decode common HTML entities.
 */
export function stripHtml(value: string | undefined): string {
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

/**
 * Truncate tafsir text to a snippet (max 420 chars).
 */
export function toTafsirSnippet(value: string | undefined): string {
    const text = stripHtml(value)

    if (text.length <= 420) {
        return text
    }

    return `${text.slice(0, 417).trimEnd()}...`
}

/**
 * Normalize a relative audio URL to an absolute one.
 */
export function getAbsoluteAudioUrl(value: string | undefined): string {
    if (!value) {
        return ''
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value
    }

    return `https://verses.quran.foundation/${value.replace(/^\/+/, '')}`
}
