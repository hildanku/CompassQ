import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { errorFromUnexpected, getRequestId } from '@/lib/api-route'
import { getTodayCheckIn } from '@/lib/services/check-ins'

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    try {
        const data = await getTodayCheckIn({
            supabase: auth.supabase,
            userId: auth.user.id,
        })

        return apiSuccess(data, "Today's check-in status loaded", { requestId })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            "Failed to load today's check-in status",
        )
    }
}
