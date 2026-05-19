'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

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
import { FeedbackMessage, useFeedbackState } from '@/lib/ui/feedback'

import { BookmarksList } from './bookmarks-list'
import { CollectionsList } from './collections-list'
import { SavedPageHero } from './saved-page-hero'
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

    return (
        <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <SavedPageHero />

                <FeedbackMessage feedback={feedback.value} />

                {selectedAyahKey ? (
                    <SelectedAyahCollectionPanel
                        selectedAyahKey={selectedAyahKey}
                        selectedAyahAlreadySaved={selectedAyahAlreadySaved}
                        collections={collections}
                        isLoadingCollections={collectionsQuery.isLoading}
                        collectionsErrorMessage={collectionsErrorMessage}
                        isAddingToCollection={addToCollectionMutation.isPending}
                        isCreatingCollection={
                            createCollectionMutation.isPending
                        }
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
                    />
                </section>
            </div>
        </main>
    )
}
