import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    validationErrorJson,
} from '@/lib/api-route'
import { removeCollectionItem } from '@/lib/services/collections'

const routeParamsSchema = z.object({
    id: z.uuid(),
    ayahKey: z.string().min(1),
})

type RouteContext = {
    params: Promise<{ id: string; ayahKey: string }>
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
        const result = await removeCollectionItem(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsedParams.data.id,
            decodeURIComponent(parsedParams.data.ayahKey),
        )

        return apiSuccess(result.data, result.message, {
            status: result.status,
            requestId,
        })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to remove collection item',
        )
    }
}
