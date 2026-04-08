import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { validationErrorJson } from '@/lib/api-route'

const routeParamsSchema = z.object({
    id: z.uuid(),
})

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
    const requestId = crypto.randomUUID()
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const params = await context.params
    const parsedParams = routeParamsSchema.safeParse(params)

    if (!parsedParams.success) {
        return validationErrorJson(parsedParams.error, requestId)
    }

    return apiSuccess(
        {
            sessionId: parsedParams.data.id,
            completed: true,
            streak: {
                current: 0,
                longest: 0,
            },
        },
        'Session completion contract skeleton ready',
        { status: 202, requestId },
    )
}
