import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { createReflectionSchema } from '@/lib/contracts'
import { createReflection } from '@/lib/services/reflections'

export async function POST(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(
        request,
        createReflectionSchema,
        requestId,
    )

    if ('response' in parsed) {
        return parsed.response
    }

    try {
        const data = await createReflection(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsed.data.sessionId,
            parsed.data.content,
        )

        return apiSuccess(data, 'Reflection saved', { status: 201, requestId })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to save reflection',
        )
    }
}
