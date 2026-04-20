import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseSearchParams,
} from '@/lib/api-route'
import { historyQuerySchema } from '@/lib/contracts'
import { getHistory } from '@/lib/services/history'

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

    try {
        const data = await getHistory(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsed.data.limit,
        )

        return apiSuccess(data, 'History loaded', { requestId })
    } catch (error) {
        return errorFromUnexpected(error, requestId, 'Failed to load history')
    }
}
