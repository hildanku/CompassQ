import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseSearchParams,
} from '@/lib/api-route'
import { weeklyInsightsQuerySchema } from '@/lib/contracts'
import { getWeeklyInsights } from '@/lib/services/insights'

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

    try {
        const data = await getWeeklyInsights(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsed.data.weekStart,
        )

        return apiSuccess(data, 'Weekly insights loaded', { requestId })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to load weekly insights',
        )
    }
}
