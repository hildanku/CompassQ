import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { getRequestId, parseSearchParams } from '@/lib/api-route'
import { historyQuerySchema } from '@/lib/contracts'

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = parseSearchParams(request, historyQuerySchema, requestId)

    if ('response' in parsed) {
        return parsed.response
    }

    return apiSuccess(
        {
            limit: parsed.data.limit,
            sessions: [],
        },
        'History contract skeleton ready',
        { requestId },
    )
}
