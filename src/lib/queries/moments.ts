import { ApiClientError, apiFetch } from '@/lib/api'
import { checkInCategoryValues } from '@/lib/contracts'

export type CheckInCategory = (typeof checkInCategoryValues)[number]

export type CheckInResponse = {
    checkInId: string
    category: CheckInCategory
    createdAt: string
    localDate: string
    reused: boolean
    hasCompletedSession: boolean
}

export type RecommendedAyah = {
    ayahKey: string
    surahNumber: number
    ayahNumber: number
    arabicText: string
    translation: string
    tafsirSnippet: string
    audioUrl: string
}

export type RecommendMomentResponse = {
    sessionId: string
    checkInId: string
    ayah: RecommendedAyah
}

export type ReflectionResponse = {
    reflectionId: string
    sessionId: string
    ayahKey: string
    createdAt: string
}

export type SessionCompletionResponse = {
    sessionId: string
    completed: boolean
    streak: {
        current: number
        longest: number
    }
}

export type HistorySession = {
    sessionId: string
    ayahKey: string
    category: CheckInCategory | null
    completed: boolean
    createdAt: string
    reflectionCount: number
    latestReflection: {
        content: string
        createdAt: string
    } | null
}

type HistoryResponse = {
    limit: number
    sessions: HistorySession[]
}

export type TodayCheckInResponse = {
    exists: boolean
    hasCompletedSession: boolean
    checkInId: string | null
    sessionId: string | null
}

export const todayCheckInQueryKey = ['check-ins', 'today'] as const

export async function fetchTodayCheckIn() {
    const payload = await apiFetch<TodayCheckInResponse>(
        '/api/v1/check-ins/today',
    )

    if (!payload.data) {
        throw new ApiClientError("Failed to load today's check-in status", {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export function historyQueryKey(limit: number) {
    return ['history', limit] as const
}

export async function createCheckIn(category: CheckInCategory) {
    const payload = await apiFetch<CheckInResponse>('/api/v1/check-ins', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
    })

    if (!payload.data) {
        throw new ApiClientError('Failed to create check-in', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function recommendMoment(checkInId: string) {
    const payload = await apiFetch<RecommendMomentResponse>(
        '/api/v1/moments/recommend',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ checkInId }),
        },
    )

    if (!payload.data?.ayah || !payload.data.sessionId) {
        throw new ApiClientError('Failed to load Quran Moment', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function createReflection(sessionId: string, content: string) {
    const payload = await apiFetch<ReflectionResponse>('/api/v1/reflections', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, content }),
    })

    if (!payload.data?.reflectionId) {
        throw new ApiClientError('Failed to save reflection', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function completeSession(sessionId: string, resonanceScore?: number | null) {
    const payload = await apiFetch<SessionCompletionResponse>(
        `/api/v1/sessions/${sessionId}/complete`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resonanceScore: resonanceScore ?? null }),
        },
    )

    if (!payload.data?.sessionId || !payload.data.streak) {
        throw new ApiClientError('Failed to complete session', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export type StreakResponse = {
    current: number
    longest: number
    lastActiveDate: string | null
}

export const streakQueryKey = ['streak'] as const

export async function fetchStreak() {
    const payload = await apiFetch<StreakResponse>('/api/v1/streaks')

    if (!payload.data) {
        throw new ApiClientError('Failed to load streak', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function fetchHistory(limit = 10) {
    const payload = await apiFetch<HistoryResponse>(
        `/api/v1/history?limit=${limit}`,
    )

    if (!payload.data?.sessions) {
        throw new ApiClientError('Failed to load history', {
            status: 500,
            payload,
        })
    }

    return payload.data
}
