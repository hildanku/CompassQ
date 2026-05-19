'use client'

import { type Collection } from '@/lib/queries/save-actions'
import { formatUtcTimestamp } from '@/lib/utils'

import { SavedAyahCard } from './saved-ayah-card'

type CollectionsListProps = {
    collections: Collection[]
    isLoading: boolean
    errorMessage: string | null
    onRetry: () => void
}

export function CollectionsList({
    collections,
    isLoading,
    errorMessage,
    onRetry,
}: CollectionsListProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                    Collections
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                    Organize ayah by season, need, or theme.
                </h2>
            </div>

            {isLoading ? (
                <div className="rounded-3xl bg-white p-5 text-sm text-zinc-600 shadow-sm shadow-zinc-950/5">
                    Loading collections...
                </div>
            ) : errorMessage ? (
                <div className="rounded-3xl border border-amber-200 bg-white p-5 text-sm text-amber-900 shadow-sm shadow-zinc-950/5">
                    <p>{errorMessage}</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-3 rounded-full border border-amber-300 px-4 py-2 text-sm font-medium transition hover:bg-amber-100"
                    >
                        Retry collections load
                    </button>
                </div>
            ) : collections.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-5 text-sm leading-6 text-zinc-600 shadow-sm shadow-zinc-950/5">
                    No collections yet. Start one for ayah you want to revisit
                    in groups.
                </div>
            ) : (
                collections.map((collection) => (
                    <section
                        key={collection.id}
                        className="rounded-4xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-950">
                                    {collection.name}
                                </h3>
                                <p className="text-sm text-zinc-500">
                                    Created{' '}
                                    {formatUtcTimestamp(collection.createdAt)}
                                </p>
                            </div>
                            <p className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600">
                                {collection.itemCount} item
                                {collection.itemCount === 1 ? '' : 's'}
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
                                        createdAt={item.createdAt}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                ))
            )}
        </div>
    )
}
