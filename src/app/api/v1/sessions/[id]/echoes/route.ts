import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { errorFromUnexpected, getRequestId, validationErrorJson } from '@/lib/api-route'
import { findEchoes } from '@/lib/services/echoes'

const routeParamsSchema = z.object({
    id: z.uuid(),
})

type RouteContext = {
    params: Promise<{ id: string }>
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
        const echoes = await findEchoes(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsedParams.data.id,
        )

        return apiSuccess(
            { sessionId: parsedParams.data.id, echoes },
            'Echoes loaded',
            { status: 200, requestId },
        )
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to load echoes',
        )
    }
}
