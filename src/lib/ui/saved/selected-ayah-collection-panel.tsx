'use client'

import { type Collection } from '@/lib/queries/save-actions'

import { CreateCollectionForm } from './create-collection-form'

type SelectedAyahCollectionPanelProps = {
    selectedAyahKey: string
    selectedAyahAlreadySaved: boolean
    collections: Collection[]
    isLoadingCollections: boolean
    collectionsErrorMessage: string | null
    isAddingToCollection: boolean
    isCreatingCollection: boolean
    onRetryCollections: () => void
    onAddToCollection: (collectionId: string) => void
    onCreateCollection: (name: string) => Promise<void>
}

export function SelectedAyahCollectionPanel({
    selectedAyahKey,
    selectedAyahAlreadySaved,
    collections,
    isLoadingCollections,
    collectionsErrorMessage,
    isAddingToCollection,
    isCreatingCollection,
    onRetryCollections,
    onAddToCollection,
    onCreateCollection,
}: SelectedAyahCollectionPanelProps) {
    return (
        <section className="rounded-4xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 sm:p-8">
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
                    {isLoadingCollections ? (
                        <div className="rounded-3xl bg-zinc-50 p-5 text-sm text-zinc-600">
                            Loading collections...
                        </div>
                    ) : collectionsErrorMessage ? (
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                            <p>{collectionsErrorMessage}</p>
                            <button
                                type="button"
                                onClick={onRetryCollections}
                                className="mt-3 rounded-full border border-amber-300 px-4 py-2 text-sm font-medium transition hover:bg-amber-100"
                            >
                                Retry collections load
                            </button>
                        </div>
                    ) : collections.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
                            No collections yet. Create your first one and this
                            ayah can go straight into it.
                        </div>
                    ) : (
                        collections.map((collection) => {
                            const alreadyExists = collection.items.some(
                                (item) => item.ayahKey === selectedAyahKey,
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
                                                {collection.itemCount} saved item
                                                {collection.itemCount === 1
                                                    ? ''
                                                    : 's'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onAddToCollection(collection.id)
                                            }
                                            disabled={isAddingToCollection}
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

                <CreateCollectionForm
                    isPending={isCreatingCollection}
                    selectedAyahKey={selectedAyahKey}
                    onSubmit={onCreateCollection}
                />
            </div>
        </section>
    )
}
