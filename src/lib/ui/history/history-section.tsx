import Link from 'next/link'

import { checkInCategoryLabels } from '@/lib/constant'
import { checkInCategoryValues } from '@/lib/contracts'
import { getAyahReference } from '@/lib/quran'
import { type HistorySession } from '@/lib/queries/moments'
import { formatUtcTimestamp } from '@/lib/utils'

type CheckInCategory = (typeof checkInCategoryValues)[number]

type HistorySectionProps = {
    sessions: HistorySession[]
    isLoading: boolean
    message: string | null
    title?: string
    description?: string
    actionHref?: string
    actionLabel?: string
    onRetry?: () => void
}

const categoryColors: Record<CheckInCategory, string> = {
    anxiety: 'bg-violet-100 text-violet-700',
    gratitude: 'bg-emerald-100 text-emerald-700',
    patience: 'bg-sky-100 text-sky-700',
    guidance: 'bg-amber-100 text-amber-700',
    hope: 'bg-teal-100 text-teal-700',
    discipline: 'bg-orange-100 text-orange-700',
    feeling_distant: 'bg-zinc-100 text-zinc-600',
    need_comfort: 'bg-rose-100 text-rose-700',
}

function getCategoryLabel(category: HistorySession['category']) {
    if (!category) {
        return 'Quran Moment'
    }

    return checkInCategoryLabels[category] ?? 'Quran Moment'
}

function getCategoryColors(category: HistorySession['category']) {
    if (!category) return 'bg-zinc-100 text-zinc-600'
    return categoryColors[category] ?? 'bg-zinc-100 text-zinc-600'
}

export function HistorySection({
    sessions,
    isLoading,
    message,
    title = 'Recent Quran Moments',
    description = 'Your latest sessions, including the newest reflection preview for each moment.',
    actionHref,
    actionLabel,
    onRetry,
}: HistorySectionProps) {
    return (
        <section className="rounded-4xl border border-white/70 bg-white/88 p-6 shadow-xl shadow-emerald-950/8 backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                    <p className="inline-flex rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        History
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                        {title}
                    </h2>
                    <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                        {description}
                    </p>
                </div>

                {actionHref && actionLabel ? (
                    <Link
                        href={actionHref}
                        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                        {actionLabel}
                    </Link>
                ) : null}
            </div>

            {isLoading ? (
                <div className="mt-5 rounded-3xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(236,253,245,0.72))] p-5 text-sm text-zinc-600">
                    Loading recent sessions...
                </div>
            ) : null}

            {message ? (
                <div className="mt-5 rounded-3xl border border-amber-200 bg-[linear-gradient(180deg,#fffbeb_0%,#fef3c7_100%)] p-5 text-sm text-amber-900">
                    <p>{message}</p>
                    {onRetry ? (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-3 rounded-full border border-amber-300 px-4 py-2 text-sm font-medium transition hover:bg-amber-100"
                        >
                            Retry history load
                        </button>
                    ) : null}
                </div>
            ) : null}

            {!isLoading && !message && sessions.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-dashed border-emerald-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,244,245,0.82))] p-5 text-sm leading-6 text-zinc-600">
                    No completed session history yet. Finish one Quran Moment
                    and it will appear here.
                </div>
            ) : null}

            {!isLoading && !message && sessions.length > 0 ? (
                <div className="mt-5 grid gap-4">
                    {sessions.map((session) => {
                        const ayahReference = getAyahReference(session.ayahKey)

                        return (
                            <article
                                key={session.sessionId}
                                className="rounded-[1.75rem] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,250,249,0.94))] p-5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColors(session.category)}`}>
                                            {getCategoryLabel(session.category)}
                                        </span>
                                        <h3 className="text-lg font-semibold text-zinc-950">
                                            {ayahReference
                                                ? `Surah ${ayahReference.surahName}, Ayah ${ayahReference.ayahNumber}`
                                                : `Ayah ${session.ayahKey}`}
                                        </h3>
                                        {ayahReference ? (
                                            <p className="text-sm text-zinc-500">
                                                {ayahReference.surahNumber}:
                                                {ayahReference.ayahNumber}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="text-right text-sm text-zinc-500">
                                        <p>
                                            {formatUtcTimestamp(
                                                session.createdAt,
                                            )}
                                        </p>
                                        <p>
                                            {session.completed
                                                ? 'Completed'
                                                : 'In progress'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-3xl border border-white/90 bg-white/88 p-4 text-sm leading-6 text-zinc-700">
                                    <p className="font-medium text-zinc-900">
                                        Latest reflection
                                    </p>
                                    <p className="mt-2">
                                        {session.latestReflection
                                            ? session.latestReflection
                                                  .content ||
                                              'Empty reflection saved.'
                                            : 'No reflection saved for this session yet.'}
                                    </p>
                                </div>

                                <div className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                                    <p>
                                        {session.reflectionCount} reflection
                                        {session.reflectionCount === 1
                                            ? ''
                                            : 's'}
                                    </p>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : null}
        </section>
    )
}
