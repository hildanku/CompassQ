import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { errorFromStatus, getRequestId, parseJsonBody } from '@/lib/api-route'
import { createCheckInSchema } from '@/lib/contracts'
import { getLocalDateInTimeZone } from '@/lib/utils'

export async function POST(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(request, createCheckInSchema, requestId)

    if ('response' in parsed) {
        return parsed.response
    }

    const { data: profile, error: profileError } = await auth.supabase
        .from('profiles')
        .select('timezone')
        .eq('id', auth.user.id)
        .single()

    if (profileError) {
        return errorFromStatus(
            500,
            'Failed to load profile timezone',
            requestId,
        )
    }

    const localDate = getLocalDateInTimeZone(profile.timezone)
    const { data: existingCheckIn, error: existingCheckInError } =
        await auth.supabase
            .from('check_ins')
            .select('id, category, created_at, local_date')
            .eq('user_id', auth.user.id)
            .eq('local_date', localDate)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

    if (existingCheckInError) {
        return errorFromStatus(
            500,
            "Failed to load today's check-in",
            requestId,
        )
    }

    if (existingCheckIn) {
        const { data: existingSession, error: existingSessionError } =
            await auth.supabase
                .from('sessions')
                .select('completed')
                .eq('user_id', auth.user.id)
                .eq('check_in_id', existingCheckIn.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

        if (existingSessionError) {
            return errorFromStatus(
                500,
                "Failed to load today's session",
                requestId,
            )
        }

        return apiSuccess(
            {
                checkInId: existingCheckIn.id,
                category: existingCheckIn.category,
                createdAt: existingCheckIn.created_at,
                localDate: existingCheckIn.local_date,
                reused: true,
                hasCompletedSession: existingSession?.completed ?? false,
            },
            "Today's check-in loaded",
            { requestId },
        )
    }

    const payload = {
        user_id: auth.user.id,
        category: parsed.data.category,
        notes: parsed.data.notes?.trim() || null,
        local_date: localDate,
    }

    const { data, error } = await auth.supabase
        .from('check_ins')
        .insert(payload)
        .select('id, category, created_at, local_date')
        .single()

    if (error) {
        return errorFromStatus(500, 'Failed to create check-in', requestId)
    }

    return apiSuccess(
        {
            checkInId: data.id,
            category: data.category,
            createdAt: data.created_at,
            localDate: data.local_date,
            reused: false,
            hasCompletedSession: false,
        },
        'Check-in created',
        { status: 201, requestId },
    )
}
