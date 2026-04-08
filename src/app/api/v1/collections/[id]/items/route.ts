import { z } from 'zod'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getDatabaseErrorCode,
    getRequestId,
    parseJsonBody,
    validationErrorJson,
} from '@/lib/api-route'
import { addCollectionItemSchema } from '@/lib/contracts'

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

    const { data: collection, error: collectionError } = await auth.supabase
        .from('collections')
        .select('id')
        .eq('id', parsedParams.data.id)
        .eq('user_id', auth.user.id)
        .maybeSingle()

    if (collectionError) {
        return errorFromStatus(500, 'Failed to validate collection', requestId)
    }

    if (!collection) {
        return errorFromStatus(404, 'Collection not found', requestId)
    }

    const { data: ayahReference, error: referenceError } = await auth.supabase
        .from('quran_references')
        .select('ayah_key')
        .eq('ayah_key', parsedBody.data.ayahKey)
        .maybeSingle()

    if (referenceError) {
        return errorFromStatus(
            500,
            'Failed to validate ayah reference',
            requestId,
        )
    }

    if (!ayahReference) {
        return errorFromStatus(404, 'Ayah reference not found', requestId)
    }

    const insertPayload = {
        collection_id: parsedParams.data.id,
        ayah_key: parsedBody.data.ayahKey,
    }

    const { data, error } = await auth.supabase
        .from('collection_items')
        .insert(insertPayload)
        .select('id, collection_id, ayah_key, created_at')
        .single()

    if (error && getDatabaseErrorCode(error) !== '23505') {
        return errorFromStatus(500, 'Failed to add collection item', requestId)
    }

    if (error && getDatabaseErrorCode(error) === '23505') {
        const { data: existingItem, error: existingItemError } =
            await auth.supabase
                .from('collection_items')
                .select('id, collection_id, ayah_key, created_at')
                .eq('collection_id', parsedParams.data.id)
                .eq('ayah_key', parsedBody.data.ayahKey)
                .single()

        if (existingItemError) {
            return errorFromStatus(
                500,
                'Failed to load existing collection item',
                requestId,
            )
        }

        return apiSuccess(
            {
                collectionItemId: existingItem.id,
                collectionId: existingItem.collection_id,
                ayahKey: existingItem.ayah_key,
                createdAt: existingItem.created_at,
                created: false,
            },
            'Collection item already exists',
            { requestId },
        )
    }

    if (!data) {
        return errorFromStatus(500, 'Failed to add collection item', requestId)
    }

    return apiSuccess(
        {
            collectionItemId: data.id,
            collectionId: data.collection_id,
            ayahKey: data.ayah_key,
            createdAt: data.created_at,
            created: true,
        },
        'Collection item created',
        { status: 201, requestId },
    )
}
