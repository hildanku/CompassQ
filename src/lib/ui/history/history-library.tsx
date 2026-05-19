'use client'

import { useQuery } from '@tanstack/react-query'

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
