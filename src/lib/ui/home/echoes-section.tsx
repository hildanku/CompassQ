'use client'

import { useRef, useState } from 'react'
import { Bookmark, Play, Pause } from 'lucide-react'

import { getSurahName } from '@/lib/quran'

export type EchoVerse = {
    ayahKey: string
    surahNumber: number
    ayahNumber: number
    arabicText: string
    translation: string
    audioUrl: string
}

type EchoCardProps = {
    verse: EchoVerse
    onBookmark: (ayahKey: string) => void
}

function EchoCard({ verse, onBookmark }: EchoCardProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    const surahName = getSurahName(verse.surahNumber)

    async function handleTogglePlay() {
        const audio = audioRef.current

        if (!audio) return

        try {
            if (audio.paused) {
                await audio.play()
                setIsPlaying(true)
            } else {
                audio.pause()
                setIsPlaying(false)
            }
        } catch {
            setIsPlaying(false)
        }
    }

    return (
        <article className="flex w-72 shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:w-80">
            <div className="space-y-1">
                <p className="text-xs font-medium text-emerald-700">
                    {surahName} {verse.ayahKey}
                </p>
                <p
                    className="text-right text-lg leading-relaxed text-zinc-950"
                    dir="rtl"
                >
                    {verse.arabicText.length > 100
                        ? `${verse.arabicText.slice(0, 100)}...`
                        : verse.arabicText}
                </p>
            </div>

            <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600">
                {verse.translation.length > 120
                    ? `${verse.translation.slice(0, 120)}...`
                    : verse.translation}
            </p>

            <div className="mt-4 flex items-center gap-2">
                {verse.audioUrl ? (
                    <>
                        <audio
                            ref={audioRef}
                            preload="none"
                            src={verse.audioUrl}
                            onEnded={() => setIsPlaying(false)}
                            onError={() => setIsPlaying(false)}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleTogglePlay}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            aria-label={isPlaying ? 'Pause recitation' : 'Play recitation'}
                        >
                            {isPlaying ? (
                                <Pause className="h-3.5 w-3.5 fill-current" />
                            ) : (
                                <Play className="h-3.5 w-3.5 fill-current" />
                            )}
                        </button>
                    </>
                ) : null}

                <button
                    type="button"
                    onClick={() => onBookmark(verse.ayahKey)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label={`Bookmark ${verse.ayahKey}`}
                >
                    <Bookmark className="h-3.5 w-3.5" />
                </button>

                <span className="ml-auto text-xs text-zinc-400">
                    Ayah {verse.ayahNumber}
                </span>
            </div>
        </article>
    )
}

function EchoesSkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="w-72 shrink-0 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-50 p-4 sm:w-80"
                >
                    <div className="h-3 w-20 rounded-full bg-zinc-200" />
                    <div className="mt-3 h-12 rounded-xl bg-zinc-200" />
                    <div className="mt-3 h-16 rounded-xl bg-zinc-200" />
                    <div className="mt-4 flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-200" />
                        <div className="h-8 w-8 rounded-full bg-zinc-200" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function EchoesSection({
    echoes,
    isLoading,
    isSavingCollection,
    collectionSaved,
    onBookmark,
    onSaveAsCollection,
}: {
    echoes: EchoVerse[]
    isLoading: boolean
    isSavingCollection: boolean
    collectionSaved: boolean
    onBookmark: (ayahKey: string) => void
    onSaveAsCollection: () => void
}) {
    if (isLoading) {
        return (
            <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                        Quran Echoes
                    </p>
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                        Finding related verses...
                    </h2>
                </div>
                <div className="mt-4">
                    <EchoesSkeleton />
                </div>
            </section>
        )
    }

    if (echoes.length === 0) {
        return null
    }

    return (
        <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                    Quran Echoes
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                    This verse echoes across the Quran.
                </h2>
                <p className="text-sm leading-6 text-zinc-600">
                    Discover how the Quran addresses this theme from different
                    angles — as a promise, a command, a story, or a reminder.
                </p>
            </div>

            <div className="mt-4 -mx-5 px-5 sm:-mx-6 sm:px-6">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                    {echoes.map((verse) => (
                        <EchoCard
                            key={verse.ayahKey}
                            verse={verse}
                            onBookmark={onBookmark}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-4">
                {collectionSaved ? (
                    <p className="text-sm font-medium text-emerald-700">
                        Saved to your collections.
                    </p>
                ) : (
                    <button
                        type="button"
                        onClick={onSaveAsCollection}
                        disabled={isSavingCollection}
                        className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSavingCollection
                            ? 'Saving...'
                            : 'Save as Collection'}
                    </button>
                )}
            </div>
        </section>
    )
}
