'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ApiClientError } from '@/lib/api'
import {
    bookmarkStatusQueryKey,
    bookmarksQueryKey,
    createBookmark,
    fetchBookmarkStatus,
    removeBookmark,
} from '@/lib/queries/save-actions'
import { FeedbackMessage, useFeedbackState } from '@/lib/ui/feedback'

export function SaveActions({ ayahKey }: { ayahKey: string }) {
    const queryClient = useQueryClient()
    const feedback = useFeedbackState()

    const bookmarkStatusQuery = useQuery({
        queryKey: bookmarkStatusQueryKey(ayahKey),
        queryFn: () => fetchBookmarkStatus(ayahKey),
    })

    const bookmarkMutation = useMutation({
        mutationFn: createBookmark,
        onSuccess: async (data) => {
            if (data.created) {
                feedback.success(`Ayah ${data.ayahKey} bookmarked.`)
            } else {
                feedback.info(`Ayah ${data.ayahKey} was already bookmarked.`)
            }
            await queryClient.invalidateQueries({
                queryKey: bookmarkStatusQueryKey(ayahKey),
            })
            await queryClient.invalidateQueries({
                queryKey: bookmarksQueryKey,
            })
        },
        onError: (error) => {
            feedback.error(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to bookmark this ayah.',
            )
        },
    })

    const removeBookmarkMutation = useMutation({
        mutationFn: removeBookmark,
        onSuccess: async (data) => {
            feedback.success(`Bookmark removed for ayah ${data.ayahKey}.`)
            await queryClient.invalidateQueries({
                queryKey: bookmarkStatusQueryKey(ayahKey),
            })
            await queryClient.invalidateQueries({
                queryKey: bookmarksQueryKey,
            })
        },
        onError: (error) => {
            feedback.error(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to remove bookmark.',
            )
        },
    })

    const isBookmarked = bookmarkStatusQuery.data?.isBookmarked ?? false
    const isCheckingBookmarkStatus = bookmarkStatusQuery.isLoading
    const isMutating =
        bookmarkMutation.isPending ||
        removeBookmarkMutation.isPending ||
        isCheckingBookmarkStatus

    return (
        <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                        Save actions
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                        Keep this ayah close.
                    </h2>
                    <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                        Bookmark it instantly, or move it into a collection on a
                        separate saved page.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            feedback.clear()

                            if (isBookmarked) {
                                void removeBookmarkMutation.mutateAsync(ayahKey)
                                return
                            }

                            void bookmarkMutation.mutateAsync(ayahKey)
                        }}
                        disabled={isMutating}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isBookmarked
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                                : 'bg-zinc-950 text-white hover:bg-zinc-800'
                        }`}
                    >
                        {isCheckingBookmarkStatus
                            ? 'Checking bookmark...'
                            : isMutating
                            ? 'Saving...'
                            : isBookmarked
                              ? 'Bookmarked'
                              : 'Bookmark instantly'}
                    </button>

                    <Link
                        href={`/saved?ayahKey=${encodeURIComponent(ayahKey)}`}
                        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                        Add to collection
                    </Link>
                </div>
            </div>

            {bookmarkStatusQuery.error instanceof ApiClientError ? (
                <p className="mt-4 text-sm text-zinc-600">
                    {bookmarkStatusQuery.error.message}
                </p>
            ) : null}

            <FeedbackMessage feedback={feedback.value} className="mt-4" />
        </section>
    )
}
