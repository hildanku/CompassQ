import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { errorFromStatus, getRequestId, parseJsonBody } from '@/lib/api-route'
import { createCheckInSchema } from '@/lib/contracts'

function getLocalDate(timezone: string) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date())
}

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

    const localDate = getLocalDate(profile.timezone)
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
        },
        'Check-in created',
        { status: 201, requestId },
    )
}
