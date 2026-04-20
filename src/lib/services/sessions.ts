import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'

function diffInDays(fromDate: string, toDate: string) {
    const from = new Date(`${fromDate}T00:00:00Z`)
    const to = new Date(`${toDate}T00:00:00Z`)
    const millisecondsPerDay = 24 * 60 * 60 * 1000

    return Math.round((to.getTime() - from.getTime()) / millisecondsPerDay)
}

export async function completeSession(
    { supabase, userId }: ServiceContext,
    sessionId: string,
) {
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, completed, check_in_id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()

    if (sessionError) {
        throw new ServiceError(500, 'Failed to load session')
    }

    if (!session) {
        throw new ServiceError(404, 'Session not found')
    }

    const { data: checkIn, error: checkInError } = await supabase
        .from('check_ins')
        .select('local_date')
        .eq('id', session.check_in_id)
        .eq('user_id', userId)
        .maybeSingle()

    if (checkInError) {
        throw new ServiceError(500, 'Failed to load check-in date')
    }

    const localDate = checkIn?.local_date

    if (!localDate) {
        throw new ServiceError(500, 'Session is missing check-in date')
    }

    const { data: existingStreak, error: streakLoadError } = await supabase
        .from('streaks')
        .select(
            'user_id, current_streak_days, longest_streak_days, last_active_local_date',
        )
        .eq('user_id', userId)
        .maybeSingle()

    if (streakLoadError) {
        throw new ServiceError(500, 'Failed to load streak')
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

        const { error: streakUpsertError } = await supabase
            .from('streaks')
            .upsert(
                {
                    user_id: userId,
                    current_streak_days: currentStreakDays,
                    longest_streak_days: longestStreakDays,
                    last_active_local_date: localDate,
                },
                { onConflict: 'user_id' },
            )

        if (streakUpsertError) {
            throw new ServiceError(500, 'Failed to update streak')
        }
    }

    if (!session.completed) {
        const { error: updateSessionError } = await supabase
            .from('sessions')
            .update({ completed: true })
            .eq('id', session.id)
            .eq('user_id', userId)

        if (updateSessionError) {
            throw new ServiceError(500, 'Failed to complete session')
        }
    }

    return {
        sessionId,
        completed: true,
        streak: {
            current: currentStreakDays,
            longest: longestStreakDays,
        },
    }
}
