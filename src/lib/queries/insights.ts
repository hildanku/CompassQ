import { ApiClientError, apiFetch } from '@/lib/api'
import { type CheckInCategory } from '@/lib/queries/moments'

export type WeeklyInsightCategory = {
    category: CheckInCategory
    count: number
}

export type WeeklyInsightAyah = {
    ayahKey: string
    count: number
}

export type ResonanceInsight = {
    averageScore: number | null
    totalRated: number
    highestAyahKey: string | null
    highestScore: number | null
    categoryAverages: Array<{ category: CheckInCategory; avg: number }>
}

export type WeeklyInsights = {
    weekStart: string
    weekEnd: string
    returnDays: number
    topCategories: WeeklyInsightCategory[]
    topAyahKeys: WeeklyInsightAyah[]
    reflectionCount: number
    resonance: ResonanceInsight
}

type WeeklyInsightsResponse = WeeklyInsights

export function weeklyInsightsQueryKey(weekStart: string) {
    return ['weekly-insights', weekStart] as const
}

export async function fetchWeeklyInsights(weekStart: string) {
    const payload = await apiFetch<WeeklyInsightsResponse>(
        `/api/v1/insights/weekly?weekStart=${encodeURIComponent(weekStart)}`,
    )

    if (!payload.data?.weekStart) {
        throw new ApiClientError('Failed to load weekly insights', {
            status: 500,
            payload,
        })
    }

    return payload.data
}
