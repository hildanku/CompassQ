import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getDatabaseErrorCode,
    getRequestId,
    parseJsonBody,
} from '@/lib/api-route'
import { createCollectionSchema } from '@/lib/contracts'

type CollectionReferenceRow = {
    surah_number: number | null
    ayah_number: number | null
    arabic_text: string | null
    translation_text: string | null
    tafsir_snippet: string | null
    audio_url: string | null
}

type CollectionItemRow = {
    id: string
    ayah_key: string
    created_at: string
    quran_references: CollectionReferenceRow | CollectionReferenceRow[] | null
}

function normalizeReference(
    reference: CollectionReferenceRow | CollectionReferenceRow[] | null,
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
        .from('collections')
        .select(
            'id, name, created_at, collection_items(id, ayah_key, created_at, quran_references(surah_number, ayah_number, arabic_text, translation_text, tafsir_snippet, audio_url))',
        )
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
                items: collection.collection_items.map(
                    (item: CollectionItemRow) => {
                        const reference = normalizeReference(
                            item.quran_references,
                        )

                        return {
                            collectionItemId: item.id,
                            ayahKey: item.ayah_key,
                            createdAt: item.created_at,
                            surahNumber: reference?.surah_number,
                            ayahNumber: reference?.ayah_number,
                            arabicText: reference?.arabic_text,
                            translation: reference?.translation_text,
                            tafsirSnippet: reference?.tafsir_snippet,
                            audioUrl: reference?.audio_url,
                        }
                    },
                ),
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
        const { data: existingCollection, error: existingCollectionError } =
            await auth.supabase
                .from('collections')
                .select('id, name, created_at')
                .eq('user_id', auth.user.id)
                .eq('name', parsed.data.name)
                .single()

        if (existingCollectionError) {
            return errorFromStatus(
                500,
                'Failed to load existing collection',
                requestId,
            )
        }

        return apiSuccess(
            {
                collectionId: existingCollection.id,
                name: existingCollection.name,
                createdAt: existingCollection.created_at,
                created: false,
            },
            'Collection already exists',
            { requestId },
        )
    }

    if (error) {
        return errorFromStatus(500, 'Failed to create collection', requestId)
    }

    return apiSuccess(
        {
            collectionId: data.id,
            name: data.name,
            createdAt: data.created_at,
            created: true,
        },
        'Collection created',
        { status: 201, requestId },
    )
}
