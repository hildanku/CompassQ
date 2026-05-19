'use client'

import { formatUtcTimestamp } from '@/lib/utils'

type SavedAyahCardProps = {
    ayahKey: string
    arabicText: string | null
    translation: string | null
    createdAt: string
}

export function SavedAyahCard({
    ayahKey,
    arabicText,
    translation,
    createdAt,
}: SavedAyahCardProps) {
    return (
        <article className="rounded-[1.75rem] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(250,250,249,0.96))] p-5 shadow-sm shadow-zinc-950/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-zinc-500">Ayah</p>
                    <h3 className="text-lg font-semibold text-zinc-950">
                        {ayahKey}
                    </h3>
                </div>
                <p className="text-sm text-zinc-500">
                    Saved {formatUtcTimestamp(createdAt)}
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
                {translation ?? 'Translation is unavailable for this saved ayah.'}
            </p>
        </article>
    )
}
