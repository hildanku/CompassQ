import { getDatabaseErrorCode } from '@/lib/api-route'
import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'

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

export async function listCollections({ supabase, userId }: ServiceContext) {
    const { data, error } = await supabase
        .from('collections')
        .select(
            'id, name, created_at, collection_items(id, ayah_key, created_at, quran_references(surah_number, ayah_number, arabic_text, translation_text, tafsir_snippet, audio_url))',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new ServiceError(500, 'Failed to load collections')
    }

    return {
        collections: data.map((collection) => ({
            id: collection.id,
            name: collection.name,
            createdAt: collection.created_at,
            itemCount: collection.collection_items.length,
            items: collection.collection_items.map(
                (item: CollectionItemRow) => {
                    const reference = normalizeReference(item.quran_references)

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
    }
}

export async function createCollection(
    { supabase, userId }: ServiceContext,
    name: string,
) {
    const { data, error } = await supabase
        .from('collections')
        .insert({
            user_id: userId,
            name,
        })
        .select('id, name, created_at')
        .single()

    if (error && getDatabaseErrorCode(error) === '23505') {
        const { data: existingCollection, error: existingCollectionError } =
            await supabase
                .from('collections')
                .select('id, name, created_at')
                .eq('user_id', userId)
                .eq('name', name)
                .single()

        if (existingCollectionError) {
            throw new ServiceError(500, 'Failed to load existing collection')
        }

        return {
            message: 'Collection already exists',
            status: 200,
            data: {
                collectionId: existingCollection.id,
                name: existingCollection.name,
                createdAt: existingCollection.created_at,
                created: false,
            },
        }
    }

    if (error) {
        throw new ServiceError(500, 'Failed to create collection')
    }

    return {
        message: 'Collection created',
        status: 201,
        data: {
            collectionId: data.id,
            name: data.name,
            createdAt: data.created_at,
            created: true,
        },
    }
}

export async function addCollectionItem(
    { supabase, userId }: ServiceContext,
    collectionId: string,
    ayahKey: string,
) {
    const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id')
        .eq('id', collectionId)
        .eq('user_id', userId)
        .maybeSingle()

    if (collectionError) {
        throw new ServiceError(500, 'Failed to validate collection')
    }

    if (!collection) {
        throw new ServiceError(404, 'Collection not found')
    }

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
        .from('collection_items')
        .insert({
            collection_id: collectionId,
            ayah_key: ayahKey,
        })
        .select('id, collection_id, ayah_key, created_at')
        .single()

    if (error && getDatabaseErrorCode(error) !== '23505') {
        throw new ServiceError(500, 'Failed to add collection item')
    }

    if (error && getDatabaseErrorCode(error) === '23505') {
        const { data: existingItem, error: existingItemError } = await supabase
            .from('collection_items')
            .select('id, collection_id, ayah_key, created_at')
            .eq('collection_id', collectionId)
            .eq('ayah_key', ayahKey)
            .single()

        if (existingItemError) {
            throw new ServiceError(
                500,
                'Failed to load existing collection item',
            )
        }

        return {
            message: 'Collection item already exists',
            status: 200,
            data: {
                collectionItemId: existingItem.id,
                collectionId: existingItem.collection_id,
                ayahKey: existingItem.ayah_key,
                createdAt: existingItem.created_at,
                created: false,
            },
        }
    }

    if (!data) {
        throw new ServiceError(500, 'Failed to add collection item')
    }

    return {
        message: 'Collection item created',
        status: 201,
        data: {
            collectionItemId: data.id,
            collectionId: data.collection_id,
            ayahKey: data.ayah_key,
            createdAt: data.created_at,
            created: true,
        },
    }
}
