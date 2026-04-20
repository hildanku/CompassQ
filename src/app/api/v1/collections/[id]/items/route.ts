import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseJsonBody,
    validationErrorJson,
} from '@/lib/api-route'
import { addCollectionItemSchema } from '@/lib/contracts'
import { addCollectionItem } from '@/lib/services/collections'

const routeParamsSchema = z.object({
    id: z.uuid(),
})

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
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

    const parsedBody = await parseJsonBody(
        request,
        addCollectionItemSchema,
        requestId,
    )

    if ('response' in parsedBody) {
        return parsedBody.response
    }

    try {
        const result = await addCollectionItem(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsedParams.data.id,
            parsedBody.data.ayahKey,
        )

        return apiSuccess(result.data, result.message, {
            status: result.status,
            requestId,
        })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to add collection item',
        )
    }
}
