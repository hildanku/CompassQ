export type QfEnvironment = 'prelive' | 'production'

export type QfTokenCache = {
    accessToken: string
    expiresAt: number
}

export type QfAyahPayload = {
    ayahKey: string
    surahNumber: number
    ayahNumber: number
    arabicText: string
    translation: string
    tafsirSnippet: string
    audioUrl: string
}

export type QfVerseResponse = {
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

export type CachedAyahReference = {
    ayah_key: string
    surah_number: number
    ayah_number: number
    arabic_text: string | null
    translation_text: string | null
    tafsir_snippet: string | null
    audio_url: string | null
}

export type QfTokenResponse = {
    access_token: string
    refresh_token?: string
    id_token?: string
    expires_in: number
    token_type: string
}

export type QfOidcConfig = {
    clientId: string
    clientSecret: string
    environment: QfEnvironment
    oauthBaseUrl: string
    apiBaseUrl: string
    redirectUri: string
    scope: string
}

export type QfContentConfig = {
    clientId: string
    clientSecret: string
    environment: QfEnvironment
    authBaseUrl: string
    apiBaseUrl: string
    translationResourceId: number
    tafsirResourceId: number
    recitationId: number
}
