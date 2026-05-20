import { ApiClientError, apiFetch } from '@/lib/api'

export type SavedAyah = {
    ayahKey: string
    createdAt: string
    surahNumber: number | null
    ayahNumber: number | null
    arabicText: string | null
    translation: string | null
    tafsirSnippet: string | null
    audioUrl: string | null
}

export type Bookmark = SavedAyah & {
    bookmarkId: string
}

export type BookmarkStatus = {
    ayahKey: string
    isBookmarked: boolean
}

export type CollectionItem = SavedAyah & {
    collectionItemId: string
}

export type Collection = {
    id: string
    name: string
    createdAt: string
    itemCount: number
    items: CollectionItem[]
}

type BookmarksResponse = {
    bookmarks: Bookmark[]
}

type BookmarkStatusResponse = BookmarkStatus

type CollectionsResponse = {
    collections: Collection[]
}

type CreateBookmarkResponse = {
    bookmarkId: string
    ayahKey: string
    createdAt: string
    created: boolean
}

type DeleteBookmarkResponse = {
    ayahKey: string
    removed: boolean
}

type CreateCollectionResponse = {
    collectionId: string
    name: string
    createdAt: string
    created: boolean
}

type AddCollectionItemResponse = {
    collectionItemId: string
    collectionId: string
    ayahKey: string
    createdAt: string
    created: boolean
}

type RemoveCollectionItemResponse = {
    collectionId: string
    ayahKey: string
    removed: boolean
}

export const bookmarksQueryKey = ['bookmarks'] as const
export const collectionsQueryKey = ['collections'] as const

export function bookmarkStatusQueryKey(ayahKey: string) {
    return ['bookmarks', 'status', ayahKey] as const
}

export async function fetchBookmarks() {
    const payload = await apiFetch<BookmarksResponse>('/api/v1/bookmarks')

    if (!payload.data?.bookmarks) {
        throw new ApiClientError('Failed to load bookmarks', {
            status: 500,
            payload,
        })
    }

    return payload.data.bookmarks
}

export async function fetchBookmarkStatus(ayahKey: string) {
    const payload = await apiFetch<BookmarkStatusResponse>(
        `/api/v1/bookmarks/${encodeURIComponent(ayahKey)}`,
    )

    if (!payload.data || payload.data.ayahKey !== ayahKey) {
        throw new ApiClientError('Failed to load bookmark status', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function createBookmark(ayahKey: string) {
    const payload = await apiFetch<CreateBookmarkResponse>(
        '/api/v1/bookmarks',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ayahKey }),
        },
    )

    if (!payload.data?.bookmarkId) {
        throw new ApiClientError('Failed to create bookmark', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function removeBookmark(ayahKey: string) {
    const payload = await apiFetch<DeleteBookmarkResponse>(
        `/api/v1/bookmarks/${encodeURIComponent(ayahKey)}`,
        {
            method: 'DELETE',
        },
    )

    if (!payload.data?.removed) {
        throw new ApiClientError('Failed to remove bookmark', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function fetchCollections() {
    const payload = await apiFetch<CollectionsResponse>('/api/v1/collections')

    if (!payload.data?.collections) {
        throw new ApiClientError('Failed to load collections', {
            status: 500,
            payload,
        })
    }

    return payload.data.collections
}

export async function createCollection(name: string) {
    const payload = await apiFetch<CreateCollectionResponse>(
        '/api/v1/collections',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        },
    )

    if (!payload.data?.collectionId) {
        throw new ApiClientError('Failed to create collection', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function addCollectionItem(collectionId: string, ayahKey: string) {
    const payload = await apiFetch<AddCollectionItemResponse>(
        `/api/v1/collections/${collectionId}/items`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ayahKey }),
        },
    )

    if (!payload.data?.collectionItemId) {
        throw new ApiClientError('Failed to add collection item', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function removeCollectionItem(
    collectionId: string,
    ayahKey: string,
) {
    const payload = await apiFetch<RemoveCollectionItemResponse>(
        `/api/v1/collections/${collectionId}/items/${encodeURIComponent(ayahKey)}`,
        {
            method: 'DELETE',
        },
    )

    if (!payload.data?.removed) {
        throw new ApiClientError('Failed to remove collection item', {
            status: 500,
            payload,
        })
    }

    return payload.data
}
