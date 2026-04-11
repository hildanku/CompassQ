'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { ApiClientError } from '@/lib/api'
import { fetchHistory, historyQueryKey } from '@/lib/queries/moments'

import { HistorySection } from './history-section'

export function HistoryLibrary() {
    const historyQuery = useQuery({
        queryKey: historyQueryKey(10),
        queryFn: () => fetchHistory(10),
    })

    return (
        <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
                <section className="rounded-[2rem] bg-emerald-950 px-6 py-8 text-white shadow-sm sm:px-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
                                History
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Revisit the moments that brought you back.
                            </h1>
                            <p className="max-w-3xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                                Your latest Quran Moments stay visible here so
                                the path from check-in to reflection can become
                                a repeatable return habit.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                            <Link
                                href="/insights"
                                className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                            >
                                Weekly recap
                            </Link>
                            <Link
                                href="/"
                                className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                            >
                                Back home
                            </Link>
                            <Link
                                href="/saved"
                                className="rounded-full bg-white px-4 py-2 font-medium text-emerald-950 transition hover:bg-emerald-50"
                            >
                                Saved library
                            </Link>
                        </div>
                    </div>
                </section>

                <HistorySection
                    sessions={historyQuery.data?.sessions ?? []}
                    isLoading={historyQuery.isLoading}
                    message={
                        historyQuery.error instanceof ApiClientError
                            ? historyQuery.error.message
                            : historyQuery.error
                              ? 'Failed to load recent history.'
                              : null
                    }
                    title="Your last 10 Quran Moments"
                    description="Each session stays tied to its ayah, category, and latest reflection preview so you can see your return pattern clearly."
                />
            </div>
        </main>
    )
}
