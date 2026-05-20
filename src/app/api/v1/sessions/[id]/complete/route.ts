import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    validationErrorJson,
} from '@/lib/api-route'
import { completeSession } from '@/lib/services/sessions'

const routeParamsSchema = z.object({
    id: z.uuid(),
})

const bodySchema = z.object({
    resonanceScore: z.number().int().min(1).max(5).nullish(),
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

    let resonanceScore: number | null | undefined = undefined

    try {
        const rawBody = await request.text()

        if (rawBody.length > 0) {
            const json = JSON.parse(rawBody)
            const parsedBody = bodySchema.safeParse(json)

            if (!parsedBody.success) {
                return validationErrorJson(parsedBody.error, requestId)
            }

            resonanceScore = parsedBody.data.resonanceScore
        }
    } catch {
        // Empty body is fine - resonanceScore stays undefined
    }

    try {
        const data = await completeSession(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsedParams.data.id,
            resonanceScore,
        )

        return apiSuccess(data, 'Session completed', { status: 200, requestId })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to complete session',
        )
    }
}
