'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ApiClientError } from '@/lib/api'
import { AppBottomNav } from '@/lib/ui/app-bottom-nav'
import {
    AuthenticatedPageHeader,
    AuthenticatedPageShell,
} from '@/lib/ui/authenticated-page-shell'
import { checkInCategoryLabels } from '@/lib/constant'
import { addDaysToIsoDate, formatUtcDateRange } from '@/lib/utils'
import {
    fetchWeeklyInsights,
    weeklyInsightsQueryKey,
} from '@/lib/queries/insights'

export function WeeklyInsightsDashboard({
    initialWeekStart,
}: {
    initialWeekStart: string
}) {
    const [weekStart, setWeekStart] = useState(initialWeekStart)
    const nextWeekStart = addDaysToIsoDate(weekStart, 7)
    const isViewingCurrentWeek = weekStart === initialWeekStart
    const canViewNextWeek = nextWeekStart <= initialWeekStart

    const weeklyInsightsQuery = useQuery({
        queryKey: weeklyInsightsQueryKey(weekStart),
        queryFn: () => fetchWeeklyInsights(weekStart),
    })

    const weeklyInsights = weeklyInsightsQuery.data

    return (
        <AuthenticatedPageShell>
            <AuthenticatedPageHeader
                eyebrow="Weekly recap"
                title="See how often you returned this week."
                description="CompassQ turns individual sessions into a weekly pattern you can actually revisit: return days, reflection volume, top categories, and ayah that kept surfacing."
            />

            <section className="rounded-4xl border border-white/70 bg-white/88 p-6 shadow-xl shadow-emerald-950/8 backdrop-blur-xl sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                            Active week
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                            {formatUtcDateRange(
                                weekStart,
                                addDaysToIsoDate(weekStart, 6),
                            )}
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setWeekStart(addDaysToIsoDate(weekStart, -7))
                            }
                            className="rounded-full border border-zinc-200 bg-white/75 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50/80"
                        >
                            Previous week
                        </button>
                        <button
                            type="button"
                            onClick={() => setWeekStart(nextWeekStart)}
                            disabled={!canViewNextWeek}
                            className="rounded-full border border-zinc-200 bg-white/75 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50/80 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Next week
                        </button>
                        <button
                            type="button"
                            onClick={() => setWeekStart(initialWeekStart)}
                            disabled={isViewingCurrentWeek}
                            className="rounded-full border border-zinc-200 bg-white/75 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50/80 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Current week
                        </button>
                    </div>
                </div>

                {weeklyInsightsQuery.isLoading ? (
                    <div className="mt-5 rounded-3xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(236,253,245,0.72))] p-5 text-sm text-zinc-600">
                        Loading weekly recap...
                    </div>
                ) : null}

                {weeklyInsightsQuery.error ? (
                    <div className="mt-5 rounded-3xl border border-amber-200 bg-[linear-gradient(180deg,#fffbeb_0%,#fef3c7_100%)] p-5 text-sm text-amber-900">
                        <p>
                            {weeklyInsightsQuery.error instanceof ApiClientError
                                ? weeklyInsightsQuery.error.message
                                : 'Failed to load weekly recap.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                void weeklyInsightsQuery.refetch()
                            }}
                            className="mt-3 rounded-full border border-amber-300 px-4 py-2 text-sm font-medium transition hover:bg-amber-100"
                        >
                            Retry weekly recap
                        </button>
                    </div>
                ) : null}

                {weeklyInsights ? (
                    <div className="mt-5 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <article className="rounded-[1.75rem] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,250,249,0.94))] p-5">
                                <p className="text-sm font-medium text-zinc-500">
                                    Return days
                                </p>
                                <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                                    {weeklyInsights.returnDays}
                                </p>
                            </article>
                            <article className="rounded-[1.75rem] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,250,249,0.94))] p-5">
                                <p className="text-sm font-medium text-zinc-500">
                                    Reflections
                                </p>
                                <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                                    {weeklyInsights.reflectionCount}
                                </p>
                            </article>
                            <article className="rounded-[1.75rem] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,250,249,0.94))] p-5 sm:col-span-2">
                                <p className="text-sm font-medium text-zinc-500">
                                    Coverage
                                </p>
                                <p className="mt-3 text-sm leading-7 text-zinc-700">
                                    {weeklyInsights.returnDays === 0
                                        ? isViewingCurrentWeek
                                            ? 'You have not completed a return day yet this week. Start a new Quran Moment to begin building this recap.'
                                            : `No completed return days were recorded between ${formatUtcDateRange(weeklyInsights.weekStart, weeklyInsights.weekEnd)}.`
                                        : `You completed ${weeklyInsights.returnDays} return day${weeklyInsights.returnDays === 1 ? '' : 's'} between ${formatUtcDateRange(weeklyInsights.weekStart, weeklyInsights.weekEnd)}.`}
                                </p>
                            </article>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <section className="rounded-[1.75rem] border border-emerald-100/70 bg-white/68 p-5">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
                                        Top categories
                                    </p>
                                    <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
                                        What you kept bringing in.
                                    </h3>
                                </div>

                                {weeklyInsights.topCategories.length === 0 ? (
                                    <p className="mt-4 text-sm leading-6 text-zinc-600">
                                        {isViewingCurrentWeek
                                            ? 'No categories are showing yet because you have not completed a session this week.'
                                            : `No category pattern was recorded for ${formatUtcDateRange(weeklyInsights.weekStart, weeklyInsights.weekEnd)}.`}
                                    </p>
                                ) : (
                                    <div className="mt-4 grid gap-3">
                                        {weeklyInsights.topCategories.map(
                                            (item) => (
                                                <article
                                                    key={item.category}
                                                    className="rounded-2xl border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,244,245,0.9))] px-4 py-3"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm font-medium text-zinc-900">
                                                             {checkInCategoryLabels[item.category as keyof typeof checkInCategoryLabels] ?? item.category}
                                                         </p>
                                                        <p className="text-sm text-zinc-500">
                                                            {item.count} session
                                                            {item.count === 1
                                                                ? ''
                                                                : 's'}
                                                        </p>
                                                    </div>
                                                </article>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>

                            <section className="rounded-[1.75rem] border border-emerald-100/70 bg-white/68 p-5">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
                                        Top ayah
                                    </p>
                                    <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
                                        What returned most often.
                                    </h3>
                                </div>

                                {weeklyInsights.topAyahKeys.length === 0 ? (
                                    <p className="mt-4 text-sm leading-6 text-zinc-600">
                                        {isViewingCurrentWeek
                                            ? 'No ayah revisit pattern has formed yet this week.'
                                            : `No repeat ayah pattern was recorded for ${formatUtcDateRange(weeklyInsights.weekStart, weeklyInsights.weekEnd)}.`}
                                    </p>
                                ) : (
                                    <div className="mt-4 grid gap-3">
                                        {weeklyInsights.topAyahKeys.map(
                                            (item) => (
                                                <article
                                                    key={item.ayahKey}
                                                    className="rounded-2xl border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,244,245,0.9))] px-4 py-3"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm font-medium text-zinc-900">
                                                            Ayah {item.ayahKey}
                                                        </p>
                                                        <p className="text-sm text-zinc-500">
                                                            {item.count} time
                                                            {item.count === 1
                                                                ? ''
                                                                : 's'}
                                                        </p>
                                                    </div>
                                                </article>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>

                        {weeklyInsights.resonance ? (
                            <section className="rounded-[1.75rem] border border-emerald-100/70 bg-white/68 p-5">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
                                        Resonance report
                                    </p>
                                    <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
                                        What moved you most.
                                    </h3>
                                </div>

                                {weeklyInsights.resonance.totalRated === 0 ? (
                                    <p className="mt-4 text-sm leading-6 text-zinc-600">
                                        {isViewingCurrentWeek
                                            ? 'No resonance scores recorded yet this week. Rate how deeply a verse resonates after your next session.'
                                            : `No resonance data was recorded for ${formatUtcDateRange(weeklyInsights.weekStart, weeklyInsights.weekEnd)}.`}
                                    </p>
                                ) : (
                                    <div className="mt-4 space-y-4">
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <article className="rounded-2xl border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,244,245,0.9))] px-4 py-3">
                                                <p className="text-sm text-zinc-500">
                                                    Average
                                                </p>
                                                <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                                                    {weeklyInsights.resonance.averageScore}/5
                                                </p>
                                            </article>
                                            <article className="rounded-2xl border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,244,245,0.9))] px-4 py-3">
                                                <p className="text-sm text-zinc-500">
                                                    Sessions rated
                                                </p>
                                                <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                                                    {weeklyInsights.resonance.totalRated}
                                                </p>
                                            </article>
                                            {weeklyInsights.resonance.highestAyahKey ? (
                                                <article className="rounded-2xl border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,244,245,0.9))] px-4 py-3">
                                                    <p className="text-sm text-zinc-500">
                                                        Most resonant
                                                    </p>
                                                    <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
                                                        Ayah {weeklyInsights.resonance.highestAyahKey}
                                                    </p>
                                                    <p className="text-sm text-emerald-600">
                                                        {weeklyInsights.resonance.highestScore}/5
                                                    </p>
                                                </article>
                                            ) : null}
                                        </div>

                                        {weeklyInsights.resonance.categoryAverages.length > 0 ? (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-zinc-700">
                                                    Resonance by category
                                                </p>
                                                <div className="grid gap-2">
                                                    {weeklyInsights.resonance.categoryAverages.map(
                                                        (item) => (
                                                            <div
                                                                key={item.category}
                                                                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-2"
                                                            >
                                                                <p className="text-sm text-zinc-900">
                                                                    {checkInCategoryLabels[item.category as keyof typeof checkInCategoryLabels] ?? item.category}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-100">
                                                                        <div
                                                                            className="h-full rounded-full bg-emerald-500"
                                                                            style={{
                                                                                width: `${(item.avg / 5) * 100}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-sm font-medium text-zinc-600">
                                                                        {item.avg}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </section>
                        ) : null}
                    </div>
                ) : null}
            </section>

            <AppBottomNav />
        </AuthenticatedPageShell>
    )
}
