import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { errorFromUnexpected, getRequestId } from '@/lib/api-route'
import { getStreak } from '@/lib/services/streaks'

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    try {
        const data = await getStreak({
            supabase: auth.supabase,
            userId: auth.user.id,
        })

        return apiSuccess(data, 'Streak loaded', { status: 200, requestId })
    } catch (error) {
        return errorFromUnexpected(error, requestId, 'Failed to load streak')
    }
}
