'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

import { ApiClientError } from '@/lib/api'
import {
    addCollectionItem,
    bookmarksQueryKey,
    collectionsQueryKey,
    createCollection,
    fetchBookmarks,
    fetchCollections,
    removeBookmark,
    removeCollectionItem,
} from '@/lib/queries/save-actions'
import {
    AuthenticatedPageHeader,
    AuthenticatedPageShell,
} from '@/lib/ui/authenticated-page-shell'
import { AppBottomNav } from '@/lib/ui/app-bottom-nav'
import { FeedbackMessage, useFeedbackState } from '@/lib/ui/feedback'

import { BookmarksList } from './bookmarks-list'
import { CollectionsList } from './collections-list'
import { SelectedAyahCollectionPanel } from './selected-ayah-collection-panel'

export function SavedLibrary() {
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const selectedAyahKey = searchParams.get('ayahKey')?.trim() ?? ''
    const feedback = useFeedbackState()

    const bookmarksQuery = useQuery({
        queryKey: bookmarksQueryKey,
        queryFn: fetchBookmarks,
    })

    const collectionsQuery = useQuery({
        queryKey: collectionsQueryKey,
        queryFn: fetchCollections,
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
            if (data.created) {
                feedback.success(`Ayah ${data.ayahKey} added to collection.`)
            } else {
                feedback.info(
                    `Ayah ${data.ayahKey} is already in that collection.`,
                )
            }

            await queryClient.invalidateQueries({
                queryKey: collectionsQueryKey,
            })
        },
        onError: (error) => {
            feedback.error(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to add ayah to collection.',
            )
        },
    })

    const createCollectionMutation = useMutation({
        mutationFn: createCollection,
        onSuccess: async (data) => {
            if (data.created) {
                feedback.success('Collection created.')
            } else {
                feedback.info('Collection already exists. Reusing it.')
            }

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
            feedback.error(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to create collection.',
            )
        },
    })

    const removeBookmarkMutation = useMutation({
        mutationFn: removeBookmark,
        onSuccess: async (data) => {
            feedback.success(`Bookmark removed for ayah ${data.ayahKey}.`)

            await queryClient.invalidateQueries({ queryKey: bookmarksQueryKey })
        },
        onError: (error) => {
            feedback.error(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to remove bookmark.',
            )
        },
    })

    const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())

    const removeCollectionItemMutation = useMutation({
        mutationFn: ({
            collectionId,
            ayahKey,
        }: {
            collectionId: string
            ayahKey: string
        }) => removeCollectionItem(collectionId, ayahKey),
        onMutate: ({ collectionId, ayahKey }) => {
            setRemovingItems((prev) => {
                const next = new Set(prev)
                next.add(`${collectionId}:${ayahKey}`)
                return next
            })
        },
        onSuccess: async (data) => {
            feedback.success(`Ayah ${data.ayahKey} removed from collection.`)

            await queryClient.invalidateQueries({
                queryKey: collectionsQueryKey,
            })
        },
        onError: (error) => {
            feedback.error(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to remove item from collection.',
            )
        },
        onSettled: (_data, _error, variables) => {
            setRemovingItems((prev) => {
                const next = new Set(prev)
                next.delete(`${variables.collectionId}:${variables.ayahKey}`)
                return next
            })
        },
    })

    const bookmarks = bookmarksQuery.data ?? []
    const collections = collectionsQuery.data ?? []
    const selectedAyahAlreadySaved = collections.some((collection) =>
        collection.items.some((item) => item.ayahKey === selectedAyahKey),
    )
    const bookmarksErrorMessage =
        bookmarksQuery.error instanceof ApiClientError
            ? bookmarksQuery.error.message
            : bookmarksQuery.error
              ? 'Failed to load bookmarks.'
              : null
    const collectionsErrorMessage =
        collectionsQuery.error instanceof ApiClientError
            ? collectionsQuery.error.message
            : collectionsQuery.error
              ? 'Failed to load collections.'
              : null

    async function handleCreateCollection(name: string) {
        feedback.clear()
        await createCollectionMutation.mutateAsync(name)
    }

    function handleAddToCollection(collectionId: string) {
        feedback.clear()
        void addToCollectionMutation.mutateAsync({
            collectionId,
            ayahKey: selectedAyahKey,
        })
    }

    function handleRemoveBookmark(ayahKey: string) {
        feedback.clear()
        void removeBookmarkMutation.mutateAsync(ayahKey)
    }

    const handleRemoveCollectionItem = useCallback(
        (collectionId: string, ayahKey: string) => {
            feedback.clear()
            void removeCollectionItemMutation.mutateAsync({
                collectionId,
                ayahKey,
            })
        },
        [feedback, removeCollectionItemMutation],
    )

    return (
        <AuthenticatedPageShell width="wide">
            <AuthenticatedPageHeader
                eyebrow="Saved"
                title="Bookmark quickly, then organize deliberately."
                description="Keep ayah you want to revisit close at hand, then sort them into collections when a pattern starts to form."
            />

            <FeedbackMessage feedback={feedback.value} />

            {selectedAyahKey ? (
                <SelectedAyahCollectionPanel
                    selectedAyahKey={selectedAyahKey}
                    selectedAyahAlreadySaved={selectedAyahAlreadySaved}
                    collections={collections}
                    isLoadingCollections={collectionsQuery.isLoading}
                    collectionsErrorMessage={collectionsErrorMessage}
                    isAddingToCollection={addToCollectionMutation.isPending}
                    isCreatingCollection={createCollectionMutation.isPending}
                    onRetryCollections={() => {
                        void collectionsQuery.refetch()
                    }}
                    onAddToCollection={handleAddToCollection}
                    onCreateCollection={handleCreateCollection}
                />
            ) : null}

            <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                <BookmarksList
                    bookmarks={bookmarks}
                    isLoading={bookmarksQuery.isLoading}
                    errorMessage={bookmarksErrorMessage}
                    isRemovingBookmark={removeBookmarkMutation.isPending}
                    onRetry={() => {
                        void bookmarksQuery.refetch()
                    }}
                    onRemoveBookmark={handleRemoveBookmark}
                />

                <CollectionsList
                    collections={collections}
                    isLoading={collectionsQuery.isLoading}
                    errorMessage={collectionsErrorMessage}
                    onRetry={() => {
                        void collectionsQuery.refetch()
                    }}
                    onRemoveItem={handleRemoveCollectionItem}
                    removingItems={removingItems}
                />
            </section>

            <AppBottomNav />
        </AuthenticatedPageShell>
    )
}
