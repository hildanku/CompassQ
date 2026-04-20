import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { createBookmarkSchema } from '@/lib/contracts'
import { createBookmark, listBookmarks } from '@/lib/services/bookmarks'

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    try {
        const data = await listBookmarks({
            supabase: auth.supabase,
            userId: auth.user.id,
        })

        return apiSuccess(data, 'Bookmarks loaded', { requestId })
    } catch (error) {
        return errorFromUnexpected(error, requestId, 'Failed to load bookmarks')
    }
}

export async function POST(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(request, createBookmarkSchema, requestId)

    if ('response' in parsed) {
        return parsed.response
    }

    try {
        const result = await createBookmark(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsed.data.ayahKey,
        )

        return apiSuccess(result.data, result.message, {
            status: result.status,
            requestId,
        })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to create bookmark',
        )
    }
}
