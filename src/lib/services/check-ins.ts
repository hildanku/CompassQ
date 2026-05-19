import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'
import { getLocalDateInTimeZone } from '@/lib/utils'

export async function getTodayCheckIn({
    supabase,
    userId,
}: ServiceContext): Promise<{ exists: boolean; hasCompletedSession: boolean }> {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single()

    if (profileError) {
        throw new ServiceError(500, 'Failed to load profile timezone')
    }

    const localDate = getLocalDateInTimeZone(profile.timezone)
    const { data: existingCheckIn, error: existingCheckInError } =
        await supabase
            .from('check_ins')
            .select('id')
            .eq('user_id', userId)
            .eq('local_date', localDate)
            .limit(1)
            .maybeSingle()

    if (existingCheckInError) {
        throw new ServiceError(500, "Failed to load today's check-in")
    }

    if (!existingCheckIn) {
        return { exists: false, hasCompletedSession: false }
    }

    const { data: existingSession, error: existingSessionError } =
        await supabase
            .from('sessions')
            .select('completed')
            .eq('user_id', userId)
            .eq('check_in_id', existingCheckIn.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

    if (existingSessionError) {
        throw new ServiceError(500, "Failed to load today's session")
    }

    return {
        exists: true,
        hasCompletedSession: existingSession?.completed ?? false,
    }
}

export async function createCheckIn(
    { supabase, userId }: ServiceContext,
    category: string,
    notes?: string,
) {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single()

    if (profileError) {
        throw new ServiceError(500, 'Failed to load profile timezone')
    }

    const localDate = getLocalDateInTimeZone(profile.timezone)
    const { data: existingCheckIn, error: existingCheckInError } =
        await supabase
            .from('check_ins')
            .select('id, category, created_at, local_date')
            .eq('user_id', userId)
            .eq('local_date', localDate)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

    if (existingCheckInError) {
        throw new ServiceError(500, "Failed to load today's check-in")
    }

    if (existingCheckIn) {
        const { data: existingSession, error: existingSessionError } =
            await supabase
                .from('sessions')
                .select('completed')
                .eq('user_id', userId)
                .eq('check_in_id', existingCheckIn.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

        if (existingSessionError) {
            throw new ServiceError(500, "Failed to load today's session")
        }

        return {
            message: "Today's check-in loaded",
            status: 200,
            data: {
                checkInId: existingCheckIn.id,
                category: existingCheckIn.category,
                createdAt: existingCheckIn.created_at,
                localDate: existingCheckIn.local_date,
                reused: true,
                hasCompletedSession: existingSession?.completed ?? false,
            },
        }
    }

    const { data, error } = await supabase
        .from('check_ins')
        .insert({
            user_id: userId,
            category,
            notes: notes?.trim() || null,
            local_date: localDate,
        })
        .select('id, category, created_at, local_date')
        .single()

    if (error) {
        throw new ServiceError(500, 'Failed to create check-in')
    }

    return {
        message: 'Check-in created',
        status: 201,
        data: {
            checkInId: data.id,
            category: data.category,
            createdAt: data.created_at,
            localDate: data.local_date,
            reused: false,
            hasCompletedSession: false,
        },
    }
}
