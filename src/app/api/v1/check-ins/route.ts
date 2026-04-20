import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { createCheckInSchema } from '@/lib/contracts'
import { createCheckIn } from '@/lib/services/check-ins'

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

    try {
        const result = await createCheckIn(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsed.data.category,
            parsed.data.notes,
        )

        return apiSuccess(result.data, result.message, {
            status: result.status,
            requestId,
        })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to create check-in',
        )
    }
}
