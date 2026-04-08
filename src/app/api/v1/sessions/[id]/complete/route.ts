import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getRequestId,
    validationErrorJson,
} from '@/lib/api-route'

const routeParamsSchema = z.object({
    id: z.uuid(),
})

type RouteContext = {
    params: Promise<{ id: string }>
}

function diffInDays(fromDate: string, toDate: string) {
    const from = new Date(`${fromDate}T00:00:00Z`)
    const to = new Date(`${toDate}T00:00:00Z`)
    const millisecondsPerDay = 24 * 60 * 60 * 1000

    return Math.round((to.getTime() - from.getTime()) / millisecondsPerDay)
}

export async function POST(request: Request, context: RouteContext) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const params = await context.params
    const parsedParams = routeParamsSchema.safeParse(params)

    if (!parsedParams.success) {
        return validationErrorJson(parsedParams.error, requestId)
    }

    const { data: session, error: sessionError } = await auth.supabase
        .from('sessions')
        .select('id, completed, check_in_id')
        .eq('id', parsedParams.data.id)
        .eq('user_id', auth.user.id)
        .maybeSingle()

    if (sessionError) {
        return errorFromStatus(500, 'Failed to load session', requestId)
    }

    if (!session) {
        return errorFromStatus(404, 'Session not found', requestId)
    }

    const { data: checkIn, error: checkInError } = await auth.supabase
        .from('check_ins')
        .select('local_date')
        .eq('id', session.check_in_id)
        .eq('user_id', auth.user.id)
        .maybeSingle()

    if (checkInError) {
        return errorFromStatus(500, 'Failed to load check-in date', requestId)
    }

    const localDate = checkIn?.local_date

    if (!localDate) {
        return errorFromStatus(
            500,
            'Session is missing check-in date',
            requestId,
        )
    }

    const { data: existingStreak, error: streakLoadError } = await auth.supabase
        .from('streaks')
        .select(
            'user_id, current_streak_days, longest_streak_days, last_active_local_date',
        )
        .eq('user_id', auth.user.id)
        .maybeSingle()

    if (streakLoadError) {
        return errorFromStatus(500, 'Failed to load streak', requestId)
    }

    let currentStreakDays = existingStreak?.current_streak_days ?? 0
    let longestStreakDays = existingStreak?.longest_streak_days ?? 0
    const lastActiveLocalDate = existingStreak?.last_active_local_date

    if (lastActiveLocalDate !== localDate) {
        if (!lastActiveLocalDate) {
            currentStreakDays = 1
        } else {
            const dayGap = diffInDays(lastActiveLocalDate, localDate)

            if (dayGap <= 0) {
                currentStreakDays = Math.max(currentStreakDays, 1)
            } else if (dayGap === 1) {
                currentStreakDays += 1
            } else {
                currentStreakDays = 1
            }
        }

        longestStreakDays = Math.max(longestStreakDays, currentStreakDays)

        const { error: streakUpsertError } = await auth.supabase
            .from('streaks')
            .upsert(
                {
                    user_id: auth.user.id,
                    current_streak_days: currentStreakDays,
                    longest_streak_days: longestStreakDays,
                    last_active_local_date: localDate,
                },
                { onConflict: 'user_id' },
            )

        if (streakUpsertError) {
            return errorFromStatus(500, 'Failed to update streak', requestId)
        }
    }

    if (!session.completed) {
        const { error: updateSessionError } = await auth.supabase
            .from('sessions')
            .update({ completed: true })
            .eq('id', session.id)
            .eq('user_id', auth.user.id)

        if (updateSessionError) {
            return errorFromStatus(500, 'Failed to complete session', requestId)
        }
    }

    return apiSuccess(
        {
            sessionId: parsedParams.data.id,
            completed: true,
            streak: {
                current: currentStreakDays,
                longest: longestStreakDays,
            },
        },
        'Session completed',
        { status: 200, requestId },
    )
}
