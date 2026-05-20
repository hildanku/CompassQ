import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseJsonBody,
    validationErrorJson,
} from '@/lib/api-route'
import { saveEchoesAsCollection } from '@/lib/services/echoes'

const routeParamsSchema = z.object({
    id: z.uuid(),
})

const bodySchema = z.object({
    echoAyahKeys: z.array(z.string().regex(/^\d+:\d+$/)).min(1).max(10),
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

    const body = await parseJsonBody(request, bodySchema, requestId)

    if ('response' in body) {
        return body.response
    }

    try {
        const result = await saveEchoesAsCollection(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsedParams.data.id,
            body.data.echoAyahKeys,
        )

        return apiSuccess(result, 'Echoes saved as collection', {
            status: 201,
            requestId,
        })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to save echoes as collection',
        )
    }
}
