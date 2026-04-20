import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromUnexpected,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { createCollectionSchema } from '@/lib/contracts'
import { createCollection, listCollections } from '@/lib/services/collections'

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    try {
        const data = await listCollections({
            supabase: auth.supabase,
            userId: auth.user.id,
        })

        return apiSuccess(data, 'Collections loaded', { requestId })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to load collections',
        )
    }
}

export async function POST(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(
        request,
        createCollectionSchema,
        requestId,
    )

    if ('response' in parsed) {
        return parsed.response
    }

    try {
        const result = await createCollection(
            {
                supabase: auth.supabase,
                userId: auth.user.id,
            },
            parsed.data.name,
        )

        return apiSuccess(result.data, result.message, {
            status: result.status,
            requestId,
        })
    } catch (error) {
        return errorFromUnexpected(
            error,
            requestId,
            'Failed to create collection',
        )
    }
}
