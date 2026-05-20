import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'

export type StreakResponse = {
    current: number
    longest: number
    lastActiveDate: string | null
}

export async function getStreak({
    supabase,
    userId,
}: ServiceContext): Promise<StreakResponse> {
    const { data, error } = await supabase
        .from('streaks')
        .select(
            'current_streak_days, longest_streak_days, last_active_local_date',
        )
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
        throw new ServiceError(500, 'Failed to load streak')
    }

    return {
        current: data?.current_streak_days ?? 0,
        longest: data?.longest_streak_days ?? 0,
        lastActiveDate: data?.last_active_local_date ?? null,
    }
}
