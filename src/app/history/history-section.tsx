import Link from 'next/link'

import { checkInCategoryValues } from '@/lib/contracts'
import { type HistorySession } from '@/lib/queries/moments'

const historyTimestampFormatter = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
})

const categoryLabels: Record<(typeof checkInCategoryValues)[number], string> = {
    anxiety: 'Anxiety',
    gratitude: 'Gratitude',
    patience: 'Patience',
    guidance: 'Guidance',
    hope: 'Hope',
    discipline: 'Discipline',
    feeling_distant: 'Feeling Distant',
    need_comfort: 'Need Comfort',
}

function formatHistoryTimestamp(value: string) {
    return `${historyTimestampFormatter.format(new Date(value))} UTC`
}

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
        <section className="rounded-[2rem] border border-white/10 bg-white/95 p-6 shadow-2xl shadow-emerald-950/15 backdrop-blur sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                    <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
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
                <div className="mt-5 rounded-3xl bg-zinc-50 p-5 text-sm text-zinc-600">
                    Loading recent sessions...
                </div>
            ) : null}

            {message ? (
                <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
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
                <div className="mt-5 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
                    No completed session history yet. Finish one Quran Moment
                    and it will appear here.
                </div>
            ) : null}

            {!isLoading && !message && sessions.length > 0 ? (
                <div className="mt-5 grid gap-4">
                    {sessions.map((session) => (
                        <article
                            key={session.sessionId}
                            className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-zinc-500">
                                        {session.category
                                            ? categoryLabels[session.category]
                                            : 'Unknown category'}
                                    </p>
                                    <h3 className="text-lg font-semibold text-zinc-950">
                                        Ayah {session.ayahKey}
                                    </h3>
                                </div>
                                <div className="text-right text-sm text-zinc-500">
                                    <p>
                                        {formatHistoryTimestamp(
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

                            <div className="mt-4 rounded-3xl bg-white p-4 text-sm leading-6 text-zinc-700">
                                <p className="font-medium text-zinc-900">
                                    Latest reflection
                                </p>
                                <p className="mt-2">
                                    {session.latestReflection
                                        ? session.latestReflection.content ||
                                          'Empty reflection saved.'
                                        : 'No reflection saved for this session yet.'}
                                </p>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                                <p>
                                    {session.reflectionCount} reflection
                                    {session.reflectionCount === 1 ? '' : 's'}
                                </p>
                                <p>Session {session.sessionId}</p>
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}
        </section>
    )
}
