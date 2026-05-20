import { checkInCategoryValues } from '@/lib/contracts'
import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'
import { addDaysToIsoDate } from '@/lib/utils'

type CheckInCategory = (typeof checkInCategoryValues)[number]

type SessionInsightRow = {
    id: string
    ayah_key: string
    resonance_score: number | null
    check_ins: {
        local_date: string
        category: CheckInCategory
    } | null
}

function sortEntriesByCount<T extends { count: number }>(entries: T[]) {
    return entries.sort((left, right) => right.count - left.count)
}

export type ResonanceInsight = {
    averageScore: number | null
    totalRated: number
    highestAyahKey: string | null
    highestScore: number | null
    categoryAverages: Array<{ category: CheckInCategory; avg: number }>
}

function computeResonanceInsights(
    sessions: SessionInsightRow[],
): ResonanceInsight {
    const ratedSessions = sessions.filter(
        (s) => s.resonance_score != null,
    )

    if (ratedSessions.length === 0) {
        return {
            averageScore: null,
            totalRated: 0,
            highestAyahKey: null,
            highestScore: null,
            categoryAverages: [],
        }
    }

    const totalScore = ratedSessions.reduce(
        (sum, s) => sum + (s.resonance_score ?? 0),
        0,
    )
    const averageScore =
        Math.round((totalScore / ratedSessions.length) * 10) / 10

    let highestAyahKey: string | null = null
    let highestScore: number | null = null

    for (const session of ratedSessions) {
        if (
            highestScore === null ||
            (session.resonance_score ?? 0) > highestScore
        ) {
            highestScore = session.resonance_score
            highestAyahKey = session.ayah_key
        }
    }

    const categoryScores = new Map<CheckInCategory, number[]>()

    for (const session of ratedSessions) {
        const category = session.check_ins?.category
        if (!category) continue

        const scores = categoryScores.get(category) ?? []
        scores.push(session.resonance_score ?? 0)
        categoryScores.set(category, scores)
    }

    const categoryAverages = Array.from(categoryScores.entries())
        .map(([category, scores]) => ({
            category,
            avg:
                Math.round(
                    (scores.reduce((sum, s) => sum + s, 0) / scores.length) *
                        10,
                ) / 10,
        }))
        .sort((a, b) => b.avg - a.avg)

    return {
        averageScore,
        totalRated: ratedSessions.length,
        highestAyahKey,
        highestScore,
        categoryAverages,
    }
}

export async function getWeeklyInsights(
    { supabase, userId }: ServiceContext,
    weekStart: string,
) {
    const weekEnd = addDaysToIsoDate(weekStart, 6)

    const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, ayah_key, resonance_score, check_ins!inner(local_date, category)')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('check_ins.local_date', weekStart)
        .lte('check_ins.local_date', weekEnd)

    if (sessionsError) {
        throw new ServiceError(500, 'Failed to load weekly sessions')
    }

    const typedSessions = (sessions ?? []) as unknown as SessionInsightRow[]
    const returnDays = new Set(
        typedSessions
            .map((session) => session.check_ins?.local_date)
            .filter((value): value is string => Boolean(value)),
    ).size

    const categoryCounts = new Map<CheckInCategory, number>()
    const ayahCounts = new Map<string, number>()

    for (const session of typedSessions) {
        const category = session.check_ins?.category

        if (category) {
            categoryCounts.set(
                category,
                (categoryCounts.get(category) ?? 0) + 1,
            )
        }

        ayahCounts.set(
            session.ayah_key,
            (ayahCounts.get(session.ayah_key) ?? 0) + 1,
        )
    }

    const topCategories = sortEntriesByCount(
        Array.from(categoryCounts.entries()).map(([category, count]) => ({
            category,
            count,
        })),
    ).slice(0, 3)

    const topAyahKeys = sortEntriesByCount(
        Array.from(ayahCounts.entries()).map(([ayahKey, count]) => ({
            ayahKey,
            count,
        })),
    ).slice(0, 3)

    let reflectionCount = 0
    const sessionIds = typedSessions.map((session) => session.id)

    if (sessionIds.length > 0) {
        const { data: reflections, error: reflectionsError } = await supabase
            .from('reflections')
            .select('session_id')
            .eq('user_id', userId)
            .in('session_id', sessionIds)

        if (reflectionsError) {
            throw new ServiceError(500, 'Failed to load weekly reflections')
        }

        reflectionCount = reflections?.length ?? 0
    }

    const { error: weeklyRecapError } = await supabase
        .from('weekly_recaps')
        .upsert(
            {
                user_id: userId,
                week_start_date: weekStart,
                return_days: returnDays,
                top_categories: topCategories,
                top_ayah_keys: topAyahKeys,
                reflection_count: reflectionCount,
            },
            {
                onConflict: 'user_id,week_start_date',
                ignoreDuplicates: false,
            },
        )

    if (weeklyRecapError) {
        throw new ServiceError(500, 'Failed to store weekly recap')
    }

    const resonance = computeResonanceInsights(typedSessions)

    return {
        weekStart,
        weekEnd,
        returnDays,
        topCategories,
        topAyahKeys,
        reflectionCount,
        resonance,
    }
}
