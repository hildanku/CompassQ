import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getRequestId,
    validationErrorJson,
} from '@/lib/api-route'

const routeParamsSchema = z.object({
    ayahKey: z.string().trim().min(1).max(32),
})

type RouteContext = {
    params: Promise<{ ayahKey: string }>
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

    const { error } = await auth.supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', auth.user.id)
        .eq('ayah_key', parsedParams.data.ayahKey)

    if (error) {
        return errorFromStatus(500, 'Failed to remove bookmark', requestId)
    }

    return apiSuccess(
        {
            ayahKey: parsedParams.data.ayahKey,
            removed: true,
        },
        'Bookmark removed',
        { requestId },
    )
}
