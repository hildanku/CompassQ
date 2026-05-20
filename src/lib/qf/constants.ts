import type { QfEnvironment } from './types'

export const QF_OAUTH_BASE_URLS: Record<QfEnvironment, string> = {
    prelive: 'https://prelive-oauth2.quran.foundation',
    production: 'https://oauth2.quran.foundation',
}

export const QF_USER_API_BASE_URLS: Record<QfEnvironment, string> = {
    prelive: 'https://apis-prelive.quran.foundation/auth',
    production: 'https://apis.quran.foundation/auth',
}

export const QF_CONTENT_API_BASE_URLS: Record<QfEnvironment, string> = {
    prelive: 'https://apis-prelive.quran.foundation/content/api/v4',
    production: 'https://apis.quran.foundation/content/api/v4',
}

export const QF_CONTENT_DEFAULTS = {
    translationResourceId: 131,
    tafsirResourceId: 169,
    recitationId: 1,
} as const
