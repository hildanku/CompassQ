'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { HistorySection } from '@/app/history/history-section'
import { CheckInAudioPlayer } from '@/app/check-in/check-in-audio-player'
import { ReflectionSection } from '@/app/check-in/reflection-section'
import { SaveActions } from '@/app/check-in/save-actions'
import { LogoutButton } from '@/app/logout-button'
import { useCheckInFlow } from '@/app/check-in/use-check-in-flow'
import { ApiClientError } from '@/lib/api'
import { checkInCategoryLabels } from '@/lib/constant'
import { checkInCategoryValues } from '@/lib/contracts'
import { fetchHistory, historyQueryKey } from '@/lib/queries/moments'

type CheckInHomeProps = {
    displayName: string | null
}

export function CheckInHome({ displayName }: CheckInHomeProps) {
    const historyQuery = useQuery({
        queryKey: historyQueryKey(10),
        queryFn: () => fetchHistory(10),
    })

    const {
        selectedCategory,
        setSelectedCategory,
        message,
        activeMoment,
        reflectionDraft,
        reflectionError,
        reflectionStep,
        submittedReflectionLength,
        completionSummary,
        isSubmitting,
        isSavingReflection,
        shouldShowLoadingSkeleton,
        hasRetryAction,
        handleContinue,
        handleStartAnotherCheckIn,
        handleSubmitReflection,
        handleWriteAnotherReflection,
        handleReflectionDraftChange,
    } = useCheckInFlow()

    if (activeMoment) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,#14532d,#052e16_30%,#022c22_55%,#f8fafc_55%,#ffffff)] px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
                <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col gap-6">
                    <section className="rounded-4xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-emerald-950/15 backdrop-blur sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-3">
                                <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                    Quran Moment
                                </p>
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                                        Your moment is ready.
                                    </h1>
                                    <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                                        Category:{' '}
                                        {
                                            checkInCategoryLabels[
                                                activeMoment.category
                                            ]
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleStartAnotherCheckIn}
                                    className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                                >
                                    Start another check-in
                                </button>
                                <LogoutButton className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60" />
                            </div>
                        </div>

                        <div className="mt-6 space-y-5 rounded-[1.75rem] bg-zinc-50 p-5 sm:p-6">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-zinc-500">
                                    Ayah {activeMoment.ayah.ayahKey}
                                </p>
                                <p
                                    className="text-right text-3xl leading-loose text-zinc-950 sm:text-4xl"
                                    dir="rtl"
                                >
                                    {activeMoment.ayah.arabicText}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-zinc-900">
                                    Translation
                                </p>
                                <p className="text-sm leading-7 text-zinc-700 sm:text-base">
                                    {activeMoment.ayah.translation}
                                </p>
                            </div>

                            {activeMoment.ayah.tafsirSnippet ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-zinc-900">
                                        Tafsir snippet
                                    </p>
                                    <p className="text-sm leading-7 text-zinc-700 sm:text-base">
                                        {activeMoment.ayah.tafsirSnippet}
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-600">
                                    Tafsir snippet is unavailable for this
                                    moment, but you can keep reading and
                                    listening.
                                </div>
                            )}

                            <CheckInAudioPlayer
                                ayahKey={activeMoment.ayah.ayahKey}
                                audioUrl={activeMoment.ayah.audioUrl}
                            />
                        </div>

                        <div className="mt-5 grid gap-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-600 sm:grid-cols-2">
                            <p>Check-in ID: {activeMoment.checkInId}</p>
                            <p>Session ID: {activeMoment.sessionId}</p>
                        </div>

                        <SaveActions ayahKey={activeMoment.ayah.ayahKey} />

                        <ReflectionSection
                            reflectionDraft={reflectionDraft}
                            reflectionError={reflectionError}
                            reflectionStep={reflectionStep}
                            submittedReflectionLength={
                                submittedReflectionLength
                            }
                            completionSummary={completionSummary}
                            isSavingReflection={isSavingReflection}
                            onReflectionDraftChange={
                                handleReflectionDraftChange
                            }
                            onSubmitReflection={handleSubmitReflection}
                            onWriteAnotherReflection={
                                handleWriteAnotherReflection
                            }
                            onStartAnotherCheckIn={handleStartAnotherCheckIn}
                        />
                    </section>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#14532d,#052e16_30%,#022c22_55%,#f8fafc_55%,#ffffff)] px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-between gap-8">
                <section className="space-y-6 rounded-4xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-emerald-950/15 backdrop-blur sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                            <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                CompassQ
                            </p>
                            <div className="space-y-2">
                                <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                                    How are you arriving today?
                                </h1>
                                <p className="max-w-lg text-sm leading-6 text-zinc-600 sm:text-base">
                                    {displayName
                                        ? `${displayName}, pick the moment that feels closest right now.`
                                        : 'Pick the moment that feels closest right now. We will use it to start your Quran Moment.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/protected"
                                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                Profile
                            </Link>
                            <Link
                                href="/history"
                                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                History
                            </Link>
                            <Link
                                href="/insights"
                                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                Weekly recap
                            </Link>
                            <LogoutButton className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {checkInCategoryValues.map((category) => {
                            const isSelected = category === selectedCategory

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(category)
                                    }}
                                    className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition sm:text-base ${
                                        isSelected
                                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-950/15'
                                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50'
                                    }`}
                                    aria-pressed={isSelected}
                                >
                                    {checkInCategoryLabels[category]}
                                </button>
                            )
                        })}
                    </div>

                    <div className="space-y-3 rounded-3xl bg-zinc-50 p-4 sm:p-5">
                        <p className="text-sm font-medium text-zinc-900">
                            Selected category
                        </p>
                        <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                            {checkInCategoryLabels[selectedCategory]}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleContinue}
                            disabled={isSubmitting}
                            className="w-full rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                        >
                            {isSubmitting
                                ? 'Preparing your Quran Moment...'
                                : 'Continue'}
                        </button>

                        <p className="text-sm leading-6 text-zinc-500">
                            CompassQ starts with one primary check-in each day.
                            If you already started today, we will continue that
                            Quran Moment.
                        </p>

                        {shouldShowLoadingSkeleton ? (
                            <div className="space-y-4 rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-24 rounded-full bg-zinc-200" />
                                    <div className="h-16 rounded-3xl bg-zinc-200" />
                                    <div className="h-4 w-32 rounded-full bg-zinc-200" />
                                    <div className="h-20 rounded-3xl bg-zinc-200" />
                                    <div className="h-4 w-28 rounded-full bg-zinc-200" />
                                    <div className="h-16 rounded-3xl bg-zinc-200" />
                                </div>
                                <p className="text-sm leading-6 text-zinc-600">
                                    Loading your ayah, translation, tafsir, and
                                    recitation...
                                </p>
                            </div>
                        ) : null}

                        {message ? (
                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-700">
                                <p>{message}</p>
                                {hasRetryAction ? (
                                    <button
                                        type="button"
                                        onClick={handleContinue}
                                        className="mt-3 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                                    >
                                        Retry loading moment
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="grid gap-3 text-white/90 sm:grid-cols-3">
                    <article className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                        <p className="text-sm font-medium text-white">
                            1. Check in
                        </p>
                        <p className="mt-2 text-sm leading-6 text-emerald-50/85">
                            Start with one honest category.
                        </p>
                    </article>
                    <article className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                        <p className="text-sm font-medium text-white">
                            2. Get a moment
                        </p>
                        <p className="mt-2 text-sm leading-6 text-emerald-50/85">
                            The next step will bring the verse that matches it.
                        </p>
                    </article>
                    <article className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                        <p className="text-sm font-medium text-white">
                            3. Save meaning
                        </p>
                        <p className="mt-2 text-sm leading-6 text-emerald-50/85">
                            Reflection and revisit come after the core moment.
                        </p>
                    </article>
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
                    actionHref="/history"
                    actionLabel="View all history"
                    onRetry={() => {
                        void historyQuery.refetch()
                    }}
                />
            </div>
        </main>
    )
}
