import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getRequestId,
    parseSearchParams,
} from '@/lib/api-route'
import {
    checkInCategoryValues,
    weeklyInsightsQuerySchema,
} from '@/lib/contracts'

type CheckInCategory = (typeof checkInCategoryValues)[number]

type SessionInsightRow = {
    id: string
    ayah_key: string
    check_ins: Array<{
        local_date: string
        category: CheckInCategory
    }>
}

function addDays(dateText: string, days: number) {
    const date = new Date(`${dateText}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)

    return date.toISOString().slice(0, 10)
}

function sortEntriesByCount<T extends { count: number }>(entries: T[]) {
    return entries.sort((left, right) => right.count - left.count)
}

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = parseSearchParams(
        request,
        weeklyInsightsQuerySchema,
        requestId,
    )

    if ('response' in parsed) {
        return parsed.response
    }

    const weekEnd = addDays(parsed.data.weekStart, 6)

    const { data: sessions, error: sessionsError } = await auth.supabase
        .from('sessions')
        .select('id, ayah_key, check_ins!inner(local_date, category)')
        .eq('user_id', auth.user.id)
        .eq('completed', true)
        .gte('check_ins.local_date', parsed.data.weekStart)
        .lte('check_ins.local_date', weekEnd)

    if (sessionsError) {
        return errorFromStatus(500, 'Failed to load weekly sessions', requestId)
    }

    const typedSessions = (sessions ?? []) as unknown as SessionInsightRow[]
    const returnDays = new Set(
        typedSessions
            .map((session) => session.check_ins[0]?.local_date)
            .filter((value): value is string => Boolean(value)),
    ).size

    const categoryCounts = new Map<CheckInCategory, number>()
    const ayahCounts = new Map<string, number>()

    for (const session of typedSessions) {
        const category = session.check_ins[0]?.category

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
        const { data: reflections, error: reflectionsError } =
            await auth.supabase
                .from('reflections')
                .select('session_id')
                .eq('user_id', auth.user.id)
                .in('session_id', sessionIds)

        if (reflectionsError) {
            return errorFromStatus(
                500,
                'Failed to load weekly reflections',
                requestId,
            )
        }

        reflectionCount = reflections?.length ?? 0
    }

    const { error: weeklyRecapError } = await auth.supabase
        .from('weekly_recaps')
        .upsert(
            {
                user_id: auth.user.id,
                week_start_date: parsed.data.weekStart,
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
        return errorFromStatus(500, 'Failed to store weekly recap', requestId)
    }

    return apiSuccess(
        {
            weekStart: parsed.data.weekStart,
            weekEnd,
            returnDays,
            topCategories,
            topAyahKeys,
            reflectionCount,
        },
        'Weekly insights loaded',
        { requestId },
    )
}
