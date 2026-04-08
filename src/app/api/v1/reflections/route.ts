import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { getRequestId, parseJsonBody } from '@/lib/api-route'
import { createReflectionSchema } from '@/lib/contracts'

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

    return apiSuccess(
        {
            reflectionId: crypto.randomUUID(),
            sessionId: parsed.data.sessionId,
            createdAt: new Date().toISOString(),
        },
        'Reflection contract skeleton ready',
        { status: 202, requestId },
    )
}
