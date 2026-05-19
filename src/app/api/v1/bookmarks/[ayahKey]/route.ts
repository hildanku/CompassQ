import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    validationErrorJson,
} from '@/lib/api-route'
import { getBookmarkStatus, removeBookmark } from '@/lib/services/bookmarks'

const routeParamsSchema = z.object({
    ayahKey: z.string().trim().min(1).max(32),
})

type RouteContext = {
    params: Promise<{ ayahKey: string }>
}

export async function GET(request: Request, context: RouteContext) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const params = await context.params
    const parsedParams = routeParamsSchema.safeParse(params)

    if (!parsedParams.success) {
        return validationErrorJson(parsedParams.error, requestId)
    }

    try {
        const data = await getBookmarkStatus(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsedParams.data.ayahKey,
        )

        return apiSuccess(data, 'Bookmark status loaded', { requestId })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to load bookmark status',
        )
    }
}

export async function DELETE(request: Request, context: RouteContext) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const params = await context.params
    const parsedParams = routeParamsSchema.safeParse(params)

    if (!parsedParams.success) {
        return validationErrorJson(parsedParams.error, requestId)
    }

    try {
        const data = await removeBookmark(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsedParams.data.ayahKey,
        )

        return apiSuccess(data, 'Bookmark removed', { requestId })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to remove bookmark',
        )
    }
}
