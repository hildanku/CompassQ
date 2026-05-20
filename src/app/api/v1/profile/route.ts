import { apiError, apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { getRequestId, parseJsonBody } from '@/lib/api-route'
import { profileResponseSchema, updateProfileSchema } from '@/lib/contracts'

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const { data, error } = await auth.supabase
        .from('profiles')
        .select('id, display_name, timezone, created_at, updated_at')
        .eq('id', auth.user.id)
        .single()

    if (error) {
        return apiError('Failed to load profile', {
            status: 500,
            requestId,
        })
    }

    const responseData = profileResponseSchema.parse({
        profile: {
            id: data.id,
            displayName: data.display_name,
            timezone: data.timezone,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        },
    })

    return apiSuccess(responseData, 'Profile loaded', { requestId })
}

export async function PATCH(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(request, updateProfileSchema, requestId)

    if ('response' in parsed) {
        return parsed.response
    }

    const normalizedProfile = {
        display_name: parsed.data.displayName?.trim() || null,
        timezone: parsed.data.timezone?.trim() || 'UTC',
    }

    const { data, error } = await auth.supabase
        .from('profiles')
        .update(normalizedProfile)
        .eq('id', auth.user.id)
        .select('id, display_name, timezone, created_at, updated_at')
        .single()

    if (error) {
        return apiError('Failed to update profile', {
            status: 500,
            requestId,
        })
    }

    const responseData = profileResponseSchema.parse({
        profile: {
            id: data.id,
            displayName: data.display_name,
            timezone: data.timezone,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        },
    })

    return apiSuccess(responseData, 'Profile updated', { requestId })
}
