import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { recommendMomentSchema } from '@/lib/contracts'
import { recommendMoment } from '@/lib/services/moments'

export async function POST(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(
        request,
        recommendMomentSchema,
        requestId,
    )

    if ('response' in parsed) {
        return parsed.response
    }

    try {
        const result = await recommendMoment(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsed.data.checkInId,
        )

        return apiSuccess(result.data, result.message, { requestId })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to recommend Quran Moment',
        )
    }
}
