import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getDatabaseErrorCode,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { createCollectionSchema } from '@/lib/contracts'

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const { data, error } = await auth.supabase
        .from('collections')
        .select('id, name, created_at, collection_items(id)')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return errorFromStatus(500, 'Failed to load collections', requestId)
    }

    return apiSuccess(
        {
            collections: data.map((collection) => ({
                id: collection.id,
                name: collection.name,
                createdAt: collection.created_at,
                itemCount: collection.collection_items.length,
            })),
        },
        'Collections loaded',
        { requestId },
    )
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

    const payload = {
        user_id: auth.user.id,
        name: parsed.data.name,
    }

    const { data, error } = await auth.supabase
        .from('collections')
        .insert(payload)
        .select('id, name, created_at')
        .single()

    if (error && getDatabaseErrorCode(error) === '23505') {
        return errorFromStatus(409, 'Collection name already exists', requestId)
    }

    if (error) {
        return errorFromStatus(500, 'Failed to create collection', requestId)
    }

    return apiSuccess(
        {
            collectionId: data.id,
            name: data.name,
            createdAt: data.created_at,
        },
        'Collection created',
        { status: 201, requestId },
    )
}
