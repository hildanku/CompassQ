import { getDatabaseErrorCode } from '@/lib/api-route'
import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'

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

type BookmarkStatusRow = {
    id: string
}

function normalizeReference(
    reference: BookmarkReferenceRow | BookmarkReferenceRow[] | null,
) {
    return Array.isArray(reference) ? (reference[0] ?? null) : reference
}

export async function listBookmarks({ supabase, userId }: ServiceContext) {
    const { data, error } = await supabase
        .from('bookmarks')
        .select(
            'id, ayah_key, created_at, quran_references(surah_number, ayah_number, arabic_text, translation_text, tafsir_snippet, audio_url)',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new ServiceError(500, 'Failed to load bookmarks')
    }

    return {
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
    }
}

export async function getBookmarkStatus(
    { supabase, userId }: ServiceContext,
    ayahKey: string,
) {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('ayah_key', ayahKey)
        .maybeSingle()

    if (error) {
        throw new ServiceError(500, 'Failed to load bookmark status')
    }

    return {
        ayahKey,
        isBookmarked: Boolean(data as BookmarkStatusRow | null),
    }
}

export async function createBookmark(
    { supabase, userId }: ServiceContext,
    ayahKey: string,
) {
    const { data: ayahReference, error: referenceError } = await supabase
        .from('quran_references')
        .select('ayah_key')
        .eq('ayah_key', ayahKey)
        .maybeSingle()

    if (referenceError) {
        throw new ServiceError(500, 'Failed to validate ayah reference')
    }

    if (!ayahReference) {
        throw new ServiceError(404, 'Ayah reference not found')
    }

    const { data, error } = await supabase
        .from('bookmarks')
        .insert({
            user_id: userId,
            ayah_key: ayahKey,
        })
        .select('id, ayah_key, created_at')
        .single()

    if (error && getDatabaseErrorCode(error) !== '23505') {
        throw new ServiceError(500, 'Failed to create bookmark')
    }

    if (error && getDatabaseErrorCode(error) === '23505') {
        const { data: existingBookmark, error: existingBookmarkError } =
            await supabase
                .from('bookmarks')
                .select('id, ayah_key, created_at')
                .eq('user_id', userId)
                .eq('ayah_key', ayahKey)
                .single()

        if (existingBookmarkError) {
            throw new ServiceError(500, 'Failed to load existing bookmark')
        }

        return {
            message: 'Bookmark already exists',
            status: 200,
            data: {
                bookmarkId: existingBookmark.id,
                ayahKey: existingBookmark.ayah_key,
                createdAt: existingBookmark.created_at,
                created: false,
            },
        }
    }

    if (!data) {
        throw new ServiceError(500, 'Failed to create bookmark')
    }

    return {
        message: 'Bookmark created',
        status: 201,
        data: {
            bookmarkId: data.id,
            ayahKey: data.ayah_key,
            createdAt: data.created_at,
            created: true,
        },
    }
}

export async function removeBookmark(
    { supabase, userId }: ServiceContext,
    ayahKey: string,
) {
    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('ayah_key', ayahKey)

    if (error) {
        throw new ServiceError(500, 'Failed to remove bookmark')
    }

    return {
        ayahKey,
        removed: true,
    }
}
