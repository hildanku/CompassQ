'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'

import { ApiClientError } from '@/lib/api'
import {
    fetchWeeklyInsights,
    weeklyInsightsQueryKey,
} from '@/lib/queries/insights'

function addDays(dateText: string, days: number) {
    const date = new Date(`${dateText}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)

    return date.toISOString().slice(0, 10)
}

function formatDateRange(start: string, end: string) {
    return `${new Date(`${start}T00:00:00Z`).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
    })} - ${new Date(`${end}T00:00:00Z`).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })}`
}

export function WeeklyInsightsDashboard({
    initialWeekStart,
}: {
    initialWeekStart: string
}) {
    const [weekStart, setWeekStart] = useState(initialWeekStart)

    const weeklyInsightsQuery = useQuery({
        queryKey: weeklyInsightsQueryKey(weekStart),
        queryFn: () => fetchWeeklyInsights(weekStart),
    })

    const weeklyInsights = weeklyInsightsQuery.data

    return (
        <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
                <section className="rounded-[2rem] bg-emerald-950 px-6 py-8 text-white shadow-sm sm:px-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
                                Weekly recap
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                See how often you returned this week.
                            </h1>
                            <p className="max-w-3xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                                CompassQ turns individual sessions into a weekly
                                pattern you can actually revisit: return days,
                                reflection volume, top categories, and ayah that
                                kept surfacing.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                            <Link
                                href="/history"
                                className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                            >
                                History
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

                <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                                Active week
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                                {formatDateRange(
                                    weekStart,
                                    addDays(weekStart, 6),
                                )}
                            </h2>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setWeekStart(addDays(weekStart, -7))
                                }
                                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                Previous week
                            </button>
                            <button
                                type="button"
                                onClick={() => setWeekStart(initialWeekStart)}
                                disabled={weekStart === initialWeekStart}
                                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Current week
                            </button>
                        </div>
                    </div>

                    {weeklyInsightsQuery.isLoading ? (
                        <div className="mt-5 rounded-3xl bg-zinc-50 p-5 text-sm text-zinc-600">
                            Loading weekly recap...
                        </div>
                    ) : null}

                    {weeklyInsightsQuery.error ? (
                        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                            {weeklyInsightsQuery.error instanceof ApiClientError
                                ? weeklyInsightsQuery.error.message
                                : 'Failed to load weekly recap.'}
                        </div>
                    ) : null}

                    {weeklyInsights ? (
                        <div className="mt-5 space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <article className="rounded-[1.75rem] bg-zinc-50 p-5">
                                    <p className="text-sm font-medium text-zinc-500">
                                        Return days
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                                        {weeklyInsights.returnDays}
                                    </p>
                                </article>
                                <article className="rounded-[1.75rem] bg-zinc-50 p-5">
                                    <p className="text-sm font-medium text-zinc-500">
                                        Reflections
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                                        {weeklyInsights.reflectionCount}
                                    </p>
                                </article>
                                <article className="rounded-[1.75rem] bg-zinc-50 p-5 sm:col-span-2">
                                    <p className="text-sm font-medium text-zinc-500">
                                        Coverage
                                    </p>
                                    <p className="mt-3 text-sm leading-7 text-zinc-700">
                                        {weeklyInsights.returnDays === 0
                                            ? 'No completed return days yet for this week.'
                                            : `You completed ${weeklyInsights.returnDays} return day${weeklyInsights.returnDays === 1 ? '' : 's'} between ${formatDateRange(weeklyInsights.weekStart, weeklyInsights.weekEnd)}.`}
                                    </p>
                                </article>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <section className="rounded-[1.75rem] border border-zinc-200 p-5">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
                                            Top categories
                                        </p>
                                        <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
                                            What you kept bringing in.
                                        </h3>
                                    </div>

                                    {weeklyInsights.topCategories.length ===
                                    0 ? (
                                        <p className="mt-4 text-sm leading-6 text-zinc-600">
                                            No completed sessions yet this week.
                                        </p>
                                    ) : (
                                        <div className="mt-4 grid gap-3">
                                            {weeklyInsights.topCategories.map(
                                                (item) => (
                                                    <article
                                                        key={item.category}
                                                        className="rounded-2xl bg-zinc-50 px-4 py-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-sm font-medium text-zinc-900">
                                                                {item.category}
                                                            </p>
                                                            <p className="text-sm text-zinc-500">
                                                                {item.count}{' '}
                                                                session
                                                                {item.count ===
                                                                1
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

                                <section className="rounded-[1.75rem] border border-zinc-200 p-5">
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
                                            No ayah revisit pattern yet this
                                            week.
                                        </p>
                                    ) : (
                                        <div className="mt-4 grid gap-3">
                                            {weeklyInsights.topAyahKeys.map(
                                                (item) => (
                                                    <article
                                                        key={item.ayahKey}
                                                        className="rounded-2xl bg-zinc-50 px-4 py-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-sm font-medium text-zinc-900">
                                                                Ayah{' '}
                                                                {item.ayahKey}
                                                            </p>
                                                            <p className="text-sm text-zinc-500">
                                                                {item.count}{' '}
                                                                time
                                                                {item.count ===
                                                                1
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
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    )
}
