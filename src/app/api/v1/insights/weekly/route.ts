import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { getRequestId, parseSearchParams } from '@/lib/api-route'
import { weeklyInsightsQuerySchema } from '@/lib/contracts'

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = parseSearchParams(
        request,
        weeklyInsightsQuerySchema,
        requestId,
    )

    if ('response' in parsed) {
        return parsed.response
    }

    return apiSuccess(
        {
            weekStart: parsed.data.weekStart,
            returnDays: 0,
            topCategories: [],
            topAyahKeys: [],
            reflectionCount: 0,
        },
        'Weekly insights contract skeleton ready',
        { requestId },
    )
}
