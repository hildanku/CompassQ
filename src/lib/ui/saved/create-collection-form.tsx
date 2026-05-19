'use client'

import { useState } from 'react'

type CreateCollectionFormProps = {
    isPending: boolean
    selectedAyahKey: string
    onSubmit: (name: string) => Promise<void>
}

export function CreateCollectionForm({
    isPending,
    selectedAyahKey,
    onSubmit,
}: CreateCollectionFormProps) {
    const [name, setName] = useState('')

    return (
        <form
            className="rounded-[1.75rem] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,250,249,0.94))] p-5"
            onSubmit={async (event) => {
                event.preventDefault()

                try {
                    await onSubmit(name)
                    setName('')
                } catch {
                    // Keep the typed value so the user can retry after a failed request.
                }
            }}
        >
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-zinc-950">
                    Create new collection
                </h3>
                <p className="text-sm leading-6 text-zinc-600">
                    If an identical name already exists, the existing collection
                    will be reused.
                </p>
            </div>

            <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-zinc-900">
                    Collection name
                </span>
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={120}
                    required
                    className="w-full rounded-2xl border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,250,249,0.98))] px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Comfort verses"
                />
            </label>

            <button
                type="submit"
                disabled={isPending}
                className="mt-4 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
                {isPending
                    ? 'Saving collection...'
                    : selectedAyahKey
                      ? 'Create collection and add ayah'
                      : 'Create collection'}
            </button>
        </form>
    )
}
