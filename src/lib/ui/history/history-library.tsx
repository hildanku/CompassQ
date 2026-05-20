'use client'

import { useQuery } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import Link from 'next/link'

import { ApiClientError } from '@/lib/api'
import { fetchHistory, historyQueryKey } from '@/lib/queries/moments'
import { AppBottomNav } from '@/lib/ui/app-bottom-nav'
import {
    AuthenticatedPageHeader,
    AuthenticatedPageShell,
} from '@/lib/ui/authenticated-page-shell'

import { HistorySection } from './history-section'

export function HistoryLibrary() {
    const historyQuery = useQuery({
        queryKey: historyQueryKey(10),
        queryFn: () => fetchHistory(10),
    })

    return (
        <AuthenticatedPageShell>
            <AuthenticatedPageHeader
                eyebrow="History"
                title="Revisit the moments that brought you back."
                description="Your latest Quran Moments stay visible here so the path from check-in to reflection can become a repeatable return habit."
            />

            <Link
                href="/saved"
                className="flex items-center gap-3 rounded-2xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(236,253,245,0.72))] px-5 py-4 shadow-sm shadow-zinc-950/5 transition hover:border-emerald-200 hover:shadow-md"
            >
                <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Bookmark size={18} strokeWidth={2.2} />
                </span>
                <span className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-950">
                        Bookmarks &amp; Collections
                    </span>
                    <span className="text-xs text-zinc-500">
                        View saved ayah and organized collections
                    </span>
                </span>
            </Link>

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
                onRetry={() => {
                    void historyQuery.refetch()
                }}
            />

            <AppBottomNav />
        </AuthenticatedPageShell>
    )
}
