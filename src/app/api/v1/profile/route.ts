import {
    getServerAuth,
    serviceUnavailableJson,
    unauthorizedJson,
} from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api'

function parseProfileBody(body: unknown) {
    if (!body || typeof body !== 'object') {
        return { error: 'Invalid JSON body' as const }
    }

    const payload = body as Record<string, unknown>
    const displayNameValue = payload.displayName
    const timezoneValue = payload.timezone

    if (
        displayNameValue !== undefined &&
        typeof displayNameValue !== 'string'
    ) {
        return { error: 'displayName must be a string' as const }
    }

    if (timezoneValue !== undefined && typeof timezoneValue !== 'string') {
        return { error: 'timezone must be a string' as const }
    }

    const displayName = displayNameValue?.trim()
    const timezone = timezoneValue?.trim()

    if (displayName && displayName.length > 80) {
        return { error: 'displayName must be 80 characters or fewer' as const }
    }

    if (timezone !== undefined && !timezone) {
        return { error: 'timezone cannot be empty' as const }
    }

    return {
        data: {
            display_name: displayName || null,
            timezone: timezone || 'UTC',
        },
    }
}

export async function GET() {
    const { supabase, user, isConfigured } = await getServerAuth()

    if (!isConfigured || !supabase) {
        return serviceUnavailableJson()
    }

    if (!user) {
        return unauthorizedJson()
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, timezone, created_at, updated_at')
        .eq('id', user.id)
        .single()

    if (error) {
        return apiError('Failed to load profile', { status: 500 })
    }

    return apiSuccess(
        {
            profile: {
                id: data.id,
                displayName: data.display_name,
                timezone: data.timezone,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            },
        },
        'Profile loaded',
    )
}

export async function PATCH(request: Request) {
    const { supabase, user, isConfigured } = await getServerAuth()

    if (!isConfigured || !supabase) {
        return serviceUnavailableJson()
    }

    if (!user) {
        return unauthorizedJson()
    }

    let body: unknown

    try {
        body = await request.json()
    } catch {
        return apiError('Invalid JSON body', { status: 400 })
    }

    const parsed = parseProfileBody(body)

    if ('error' in parsed && typeof parsed.error === 'string') {
        return apiError(parsed.error, { status: 400 })
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(parsed.data)
        .eq('id', user.id)
        .select('id, display_name, timezone, created_at, updated_at')
        .single()

    if (error) {
        return apiError('Failed to update profile', { status: 500 })
    }

    return apiSuccess(
        {
            profile: {
                id: data.id,
                displayName: data.display_name,
                timezone: data.timezone,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            },
        },
        'Profile updated',
    )
}
