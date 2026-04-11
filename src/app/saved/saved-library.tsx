'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { ApiClientError } from '@/lib/api'
import {
    addCollectionItem,
    bookmarksQueryKey,
    collectionsQueryKey,
    createCollection,
    fetchBookmarks,
    fetchCollections,
    removeBookmark,
} from '@/lib/queries/save-actions'

function formatSavedAt(value: string) {
    return new Date(value).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function SavedAyahCard({
    ayahKey,
    arabicText,
    translation,
    createdAt,
}: {
    ayahKey: string
    arabicText: string | null
    translation: string | null
    createdAt: string
}) {
    return (
        <article className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-zinc-500">Ayah</p>
                    <h3 className="text-lg font-semibold text-zinc-950">
                        {ayahKey}
                    </h3>
                </div>
                <p className="text-sm text-zinc-500">
                    Saved {formatSavedAt(createdAt)}
                </p>
            </div>

            {arabicText ? (
                <p
                    className="mt-4 text-right text-2xl leading-loose text-zinc-950"
                    dir="rtl"
                >
                    {arabicText}
                </p>
            ) : null}

            <p className="mt-4 text-sm leading-7 text-zinc-700">
                {translation ??
                    'Translation is unavailable for this saved ayah.'}
            </p>
        </article>
    )
}

export function SavedLibrary() {
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const selectedAyahKey = searchParams.get('ayahKey')?.trim() ?? ''
    const [newCollectionName, setNewCollectionName] = useState('')
    const [message, setMessage] = useState<string | null>(null)

    const bookmarksQuery = useQuery({
        queryKey: bookmarksQueryKey,
        queryFn: fetchBookmarks,
    })

    const collectionsQuery = useQuery({
        queryKey: collectionsQueryKey,
        queryFn: fetchCollections,
    })

    const createCollectionMutation = useMutation({
        mutationFn: createCollection,
        onSuccess: async (data) => {
            setMessage(
                data.created
                    ? 'Collection created.'
                    : 'Collection already exists. Reusing it.',
            )
            setNewCollectionName('')
            await queryClient.invalidateQueries({
                queryKey: collectionsQueryKey,
            })

            if (!selectedAyahKey) {
                return
            }

            await addToCollectionMutation.mutateAsync({
                collectionId: data.collectionId,
                ayahKey: selectedAyahKey,
            })
        },
        onError: (error) => {
            setMessage(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to create collection.',
            )
        },
    })

    const addToCollectionMutation = useMutation({
        mutationFn: ({
            collectionId,
            ayahKey,
        }: {
            collectionId: string
            ayahKey: string
        }) => addCollectionItem(collectionId, ayahKey),
        onSuccess: async (data) => {
            setMessage(
                data.created
                    ? `Ayah ${data.ayahKey} added to collection.`
                    : `Ayah ${data.ayahKey} is already in that collection.`,
            )
            await queryClient.invalidateQueries({
                queryKey: collectionsQueryKey,
            })
        },
        onError: (error) => {
            setMessage(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to add ayah to collection.',
            )
        },
    })

    const removeBookmarkMutation = useMutation({
        mutationFn: removeBookmark,
        onSuccess: async (data) => {
            setMessage(`Bookmark removed for ayah ${data.ayahKey}.`)
            await queryClient.invalidateQueries({ queryKey: bookmarksQueryKey })
        },
        onError: (error) => {
            setMessage(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to remove bookmark.',
            )
        },
    })

    const bookmarks = bookmarksQuery.data ?? []
    const collections = collectionsQuery.data ?? []
    const selectedAyahAlreadySaved = collections.some((collection) =>
        collection.items.some((item) => item.ayahKey === selectedAyahKey),
    )

    async function handleCreateCollection(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()
        setMessage(null)
        await createCollectionMutation.mutateAsync(newCollectionName)
    }

    return (
        <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <section className="rounded-[2rem] bg-emerald-950 px-6 py-8 text-white shadow-sm sm:px-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
                                Saved
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Bookmark quickly, then organize deliberately.
                            </h1>
                            <p className="max-w-3xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                                Keep ayah you want to revisit close at hand,
                                then sort them into collections when a pattern
                                starts to form.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                            <Link
                                href="/history"
                                className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                            >
                                History
                            </Link>
                            <Link
                                href="/"
                                className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                            >
                                Back home
                            </Link>
                            <Link
                                href="/protected"
                                className="rounded-full bg-white px-4 py-2 font-medium text-emerald-950 transition hover:bg-emerald-50"
                            >
                                Profile
                            </Link>
                        </div>
                    </div>
                </section>

                {selectedAyahKey ? (
                    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 sm:p-8">
                        <div className="space-y-2">
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                                Current ayah
                            </p>
                            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                                Add ayah {selectedAyahKey} to a collection.
                            </h2>
                            <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                                {selectedAyahAlreadySaved
                                    ? 'This ayah already exists in at least one collection. You can still add it to another one.'
                                    : 'Choose an existing collection or create a new one. Double-clicks stay safe because duplicate inserts are idempotent.'}
                            </p>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="grid gap-3">
                                {collectionsQuery.isLoading ? (
                                    <div className="rounded-3xl bg-zinc-50 p-5 text-sm text-zinc-600">
                                        Loading collections...
                                    </div>
                                ) : collections.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
                                        No collections yet. Create your first
                                        one and this ayah can go straight into
                                        it.
                                    </div>
                                ) : (
                                    collections.map((collection) => {
                                        const alreadyExists =
                                            collection.items.some(
                                                (item) =>
                                                    item.ayahKey ===
                                                    selectedAyahKey,
                                            )

                                        return (
                                            <article
                                                key={collection.id}
                                                className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-zinc-950">
                                                            {collection.name}
                                                        </h3>
                                                        <p className="text-sm text-zinc-500">
                                                            {
                                                                collection.itemCount
                                                            }{' '}
                                                            saved item
                                                            {collection.itemCount ===
                                                            1
                                                                ? ''
                                                                : 's'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMessage(null)
                                                            void addToCollectionMutation.mutateAsync(
                                                                {
                                                                    collectionId:
                                                                        collection.id,
                                                                    ayahKey:
                                                                        selectedAyahKey,
                                                                },
                                                            )
                                                        }}
                                                        disabled={
                                                            addToCollectionMutation.isPending
                                                        }
                                                        className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                                                    >
                                                        {alreadyExists
                                                            ? 'Already saved here'
                                                            : 'Add to collection'}
                                                    </button>
                                                </div>
                                            </article>
                                        )
                                    })
                                )}
                            </div>

                            <form
                                className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5"
                                onSubmit={handleCreateCollection}
                            >
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-zinc-950">
                                        Create new collection
                                    </h3>
                                    <p className="text-sm leading-6 text-zinc-600">
                                        If an identical name already exists, the
                                        existing collection will be reused.
                                    </p>
                                </div>

                                <label className="mt-4 block space-y-2">
                                    <span className="text-sm font-medium text-zinc-900">
                                        Collection name
                                    </span>
                                    <input
                                        value={newCollectionName}
                                        onChange={(event) =>
                                            setNewCollectionName(
                                                event.target.value,
                                            )
                                        }
                                        maxLength={120}
                                        required
                                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                        placeholder="Comfort verses"
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={
                                        createCollectionMutation.isPending
                                    }
                                    className="mt-4 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                >
                                    {createCollectionMutation.isPending
                                        ? 'Saving collection...'
                                        : selectedAyahKey
                                          ? 'Create collection and add ayah'
                                          : 'Create collection'}
                                </button>
                            </form>
                        </div>

                        {message ? (
                            <p className="mt-4 text-sm text-zinc-600">
                                {message}
                            </p>
                        ) : null}
                    </section>
                ) : null}

                <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                                Bookmarks
                            </p>
                            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                                Instant saves for quick return.
                            </h2>
                        </div>

                        {bookmarksQuery.isLoading ? (
                            <div className="rounded-3xl bg-white p-5 text-sm text-zinc-600 shadow-sm shadow-zinc-950/5">
                                Loading bookmarks...
                            </div>
                        ) : bookmarks.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-5 text-sm leading-6 text-zinc-600 shadow-sm shadow-zinc-950/5">
                                No bookmarks yet. Save an ayah from the Quran
                                Moment screen and it will appear here.
                            </div>
                        ) : (
                            bookmarks.map((bookmark) => (
                                <div
                                    key={bookmark.bookmarkId}
                                    className="space-y-3"
                                >
                                    <SavedAyahCard {...bookmark} />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMessage(null)
                                            void removeBookmarkMutation.mutateAsync(
                                                bookmark.ayahKey,
                                            )
                                        }}
                                        disabled={
                                            removeBookmarkMutation.isPending
                                        }
                                        className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Remove bookmark
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                                Collections
                            </p>
                            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                                Organize ayah by season, need, or theme.
                            </h2>
                        </div>

                        {collectionsQuery.isLoading ? (
                            <div className="rounded-3xl bg-white p-5 text-sm text-zinc-600 shadow-sm shadow-zinc-950/5">
                                Loading collections...
                            </div>
                        ) : collections.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-5 text-sm leading-6 text-zinc-600 shadow-sm shadow-zinc-950/5">
                                No collections yet. Start one for ayah you want
                                to revisit in groups.
                            </div>
                        ) : (
                            collections.map((collection) => (
                                <section
                                    key={collection.id}
                                    className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-xl font-semibold text-zinc-950">
                                                {collection.name}
                                            </h3>
                                            <p className="text-sm text-zinc-500">
                                                Created{' '}
                                                {formatSavedAt(
                                                    collection.createdAt,
                                                )}
                                            </p>
                                        </div>
                                        <p className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600">
                                            {collection.itemCount} item
                                            {collection.itemCount === 1
                                                ? ''
                                                : 's'}
                                        </p>
                                    </div>

                                    {collection.items.length === 0 ? (
                                        <p className="mt-4 text-sm leading-6 text-zinc-600">
                                            This collection is empty for now.
                                        </p>
                                    ) : (
                                        <div className="mt-4 grid gap-4">
                                            {collection.items.map((item) => (
                                                <SavedAyahCard
                                                    key={item.collectionItemId}
                                                    {...item}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}
