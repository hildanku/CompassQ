import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getDatabaseErrorCode,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { createBookmarkSchema } from '@/lib/contracts'

type BookmarkReferenceRow = {
    surah_number: number | null
    ayah_number: number | null
    arabic_text: string | null
    translation_text: string | null
    tafsir_snippet: string | null
    audio_url: string | null
}

type BookmarkRow = {
    id: string
    ayah_key: string
    created_at: string
    quran_references: BookmarkReferenceRow | BookmarkReferenceRow[] | null
}

function normalizeReference(
    reference: BookmarkReferenceRow | BookmarkReferenceRow[] | null,
) {
    return Array.isArray(reference) ? (reference[0] ?? null) : reference
}

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const { data, error } = await auth.supabase
        .from('bookmarks')
        .select(
            'id, ayah_key, created_at, quran_references(surah_number, ayah_number, arabic_text, translation_text, tafsir_snippet, audio_url)',
        )
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return errorFromStatus(500, 'Failed to load bookmarks', requestId)
    }

    return apiSuccess(
        {
            bookmarks: data.map((bookmark: BookmarkRow) => {
                const reference = normalizeReference(bookmark.quran_references)

                return {
                    bookmarkId: bookmark.id,
                    ayahKey: bookmark.ayah_key,
                    createdAt: bookmark.created_at,
                    surahNumber: reference?.surah_number,
                    ayahNumber: reference?.ayah_number,
                    arabicText: reference?.arabic_text,
                    translation: reference?.translation_text,
                    tafsirSnippet: reference?.tafsir_snippet,
                    audioUrl: reference?.audio_url,
                }
            }),
        },
        'Bookmarks loaded',
        { requestId },
    )
}

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
