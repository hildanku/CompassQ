'use client'

import { type Bookmark } from '@/lib/queries/save-actions'

import { SavedAyahCard } from './saved-ayah-card'

type BookmarksListProps = {
    bookmarks: Bookmark[]
    isLoading: boolean
    errorMessage: string | null
    isRemovingBookmark: boolean
    onRetry: () => void
    onRemoveBookmark: (ayahKey: string) => void
}

export function BookmarksList({
    bookmarks,
    isLoading,
    errorMessage,
    isRemovingBookmark,
    onRetry,
    onRemoveBookmark,
}: BookmarksListProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                    Bookmarks
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                    Instant saves for quick return.
                </h2>
            </div>

            {isLoading ? (
                <div className="rounded-3xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(236,253,245,0.72))] p-5 text-sm text-zinc-600 shadow-sm shadow-zinc-950/5">
                    Loading bookmarks...
                </div>
            ) : errorMessage ? (
                <div className="rounded-3xl border border-amber-200 bg-[linear-gradient(180deg,#fffbeb_0%,#fef3c7_100%)] p-5 text-sm text-amber-900 shadow-sm shadow-zinc-950/5">
                    <p>{errorMessage}</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-3 rounded-full border border-amber-300 px-4 py-2 text-sm font-medium transition hover:bg-amber-100"
                    >
                        Retry bookmarks load
                    </button>
                </div>
            ) : bookmarks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-emerald-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,244,245,0.9))] p-5 text-sm leading-6 text-zinc-600 shadow-sm shadow-zinc-950/5">
                    No bookmarks yet. Save an ayah from the Quran Moment screen
                    and it will appear here.
                </div>
            ) : (
                bookmarks.map((bookmark) => (
                    <div key={bookmark.bookmarkId} className="space-y-3">
                        <SavedAyahCard {...bookmark} createdAt={bookmark.createdAt} />
                        <button
                            type="button"
                            onClick={() => onRemoveBookmark(bookmark.ayahKey)}
                            disabled={isRemovingBookmark}
                            className="rounded-full border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,250,249,0.98))] px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50/80 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Remove bookmark
                        </button>
                    </div>
                ))
            )}
        </div>
    )
}
