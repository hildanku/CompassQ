import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getDatabaseErrorCode,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { createBookmarkSchema } from '@/lib/contracts'

export async function POST(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(request, createBookmarkSchema, requestId)

    if ('response' in parsed) {
        return parsed.response
    }

    const { data: ayahReference, error: referenceError } = await auth.supabase
        .from('quran_references')
        .select('ayah_key')
        .eq('ayah_key', parsed.data.ayahKey)
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
        user_id: auth.user.id,
        ayah_key: parsed.data.ayahKey,
    }

    const { data, error } = await auth.supabase
        .from('bookmarks')
        .insert(insertPayload)
        .select('id, ayah_key, created_at')
        .single()

    if (error && getDatabaseErrorCode(error) !== '23505') {
        return errorFromStatus(500, 'Failed to create bookmark', requestId)
    }

    if (error && getDatabaseErrorCode(error) === '23505') {
        const { data: existingBookmark, error: existingBookmarkError } =
            await auth.supabase
                .from('bookmarks')
                .select('id, ayah_key, created_at')
                .eq('user_id', auth.user.id)
                .eq('ayah_key', parsed.data.ayahKey)
                .single()

        if (existingBookmarkError) {
            return errorFromStatus(
                500,
                'Failed to load existing bookmark',
                requestId,
            )
        }

        return apiSuccess(
            {
                bookmarkId: existingBookmark.id,
                ayahKey: existingBookmark.ayah_key,
                createdAt: existingBookmark.created_at,
                created: false,
            },
            'Bookmark already exists',
            { requestId },
        )
    }

    if (!data) {
        return errorFromStatus(500, 'Failed to create bookmark', requestId)
    }

    return apiSuccess(
        {
            bookmarkId: data.id,
            ayahKey: data.ayah_key,
            createdAt: data.created_at,
            created: true,
        },
        'Bookmark created',
        { status: 201, requestId },
    )
}
