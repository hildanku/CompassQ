'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Drawer } from 'vaul'

import { ApiClientError } from '@/lib/api'
import { checkInCategoryLabels } from '@/lib/constant'
import { checkInCategoryValues } from '@/lib/contracts'
import { getSurahName } from '@/lib/quran'
import { fetchHistory, historyQueryKey } from '@/lib/queries/moments'
import { HistorySection } from '@/lib/ui/history/history-section'
import { AppBottomNav } from '@/lib/ui/app-bottom-nav'

import { CheckInAudioPlayer } from './check-in-audio-player'
import { ReflectionSection } from './reflection-section'
import { SaveActions } from './save-actions'
import { useCheckInFlow } from './use-check-in-flow'

type CheckInHomeProps = {
    displayName: string | null
}

type CheckInComposerProps = {
    displayName: string | null
    selectedCategory: (typeof checkInCategoryValues)[number]
    setSelectedCategory: (
        category: (typeof checkInCategoryValues)[number],
    ) => void
    message: string | null
    isSubmitting: boolean
    shouldShowLoadingSkeleton: boolean
    hasRetryAction: boolean
    onContinue: () => void
}

function CheckInComposer({
    displayName,
    selectedCategory,
    setSelectedCategory,
    message,
    isSubmitting,
    shouldShowLoadingSkeleton,
    hasRetryAction,
    onContinue,
}: CheckInComposerProps) {
    return (
        <div className="space-y-6 px-4 pb-8 pt-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                    <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        CompassQ
                    </p>
                    <div className="space-y-2">
                        <Drawer.Title className="max-w-xl text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                            How are you arriving today?
                        </Drawer.Title>
                        <Drawer.Description className="max-w-lg text-sm leading-6 text-zinc-600 sm:text-base">
                            {displayName
                                ? `${displayName}, pick the moment that feels closest right now.`
                                : 'Pick the moment that feels closest right now. We will use it to start your Quran Moment.'}
                        </Drawer.Description>
                    </div>
                </div>

                <Drawer.Close asChild>
                    <button
                        type="button"
                        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                        Close
                    </button>
                </Drawer.Close>
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
                    onClick={onContinue}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                    {isSubmitting
                        ? 'Preparing your Quran Moment...'
                        : 'Continue'}
                </button>

                <p className="text-sm leading-6 text-zinc-500">
                    CompassQ starts with one primary check-in each day. If you
                    already started today, we will continue that Quran Moment.
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
                                onClick={onContinue}
                                className="mt-3 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                Retry loading moment
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export function CheckInHome({ displayName }: CheckInHomeProps) {
    const [isCheckInDrawerOpen, setIsCheckInDrawerOpen] = useState(false)
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
        const surahName = getSurahName(activeMoment.ayah.surahNumber)

        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,#14532d,#052e16_30%,#022c22_55%,#f8fafc_55%,#ffffff)] px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
                <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col gap-6 pb-28">
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

                            <button
                                type="button"
                                onClick={() => {
                                    handleStartAnotherCheckIn()
                                    setIsCheckInDrawerOpen(true)
                                }}
                                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                Start another check-in
                            </button>
                        </div>

                        <div className="mt-6 space-y-5 rounded-[1.75rem] bg-zinc-50 p-5 sm:p-6">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-zinc-500">
                                    {surahName} {activeMoment.ayah.ayahKey}
                                </p>
                                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                                    {`Surah ${surahName}, Ayah ${activeMoment.ayah.ayahNumber}`}
                                </h2>
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

                <AppBottomNav />
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#14532d,#052e16_30%,#022c22_55%,#f8fafc_55%,#ffffff)] px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col gap-8 pb-28">
                <section className="space-y-6 rounded-4xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-emerald-950/15 backdrop-blur sm:p-8">
                    <div className="space-y-3">
                        <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            CompassQ
                        </p>
                        <div className="space-y-2">
                            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                                Start today&apos;s check-in with clarity.
                            </h1>
                            <p className="max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
                                {displayName
                                    ? `${displayName}, begin with a new check-in, then revisit recent moments whenever you want to look back.`
                                    : 'Begin with a new check-in, then revisit recent moments whenever you want to look back.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCheckInDrawerOpen(true)
                            }}
                            className="rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                        >
                            Start today&apos;s check-in
                        </button>
                        <p className="text-sm leading-6 text-zinc-500">
                            One primary check-in each day. If you already
                            started today, we will continue that Quran Moment.
                        </p>
                    </div>

                    <div className="grid gap-3 text-white/90 sm:grid-cols-3">
                        <article className="rounded-3xl bg-zinc-950 p-4 text-white">
                            <p className="text-sm font-medium">1. Check in</p>
                            <p className="mt-2 text-sm leading-6 text-zinc-200">
                                Start with the moment that feels closest right
                                now.
                            </p>
                        </article>
                        <article className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-900">
                            <p className="text-sm font-medium">2. Receive</p>
                            <p className="mt-2 text-sm leading-6 text-zinc-600">
                                Open your Quran Moment with ayah, translation,
                                and recitation.
                            </p>
                        </article>
                        <article className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-900">
                            <p className="text-sm font-medium">3. Revisit</p>
                            <p className="mt-2 text-sm leading-6 text-zinc-600">
                                Return to recent sessions anytime from your
                                history.
                            </p>
                        </article>
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
                    actionHref="/history"
                    actionLabel="View all history"
                    onRetry={() => {
                        void historyQuery.refetch()
                    }}
                />
            </div>

            <Drawer.Root
                open={isCheckInDrawerOpen}
                onOpenChange={setIsCheckInDrawerOpen}
                direction="bottom"
            >
                <Drawer.Trigger asChild>
                    <button
                        type="button"
                        className="fixed right-4 bottom-24 z-50 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-emerald-950/25 transition hover:bg-zinc-800 sm:right-6"
                    >
                        + Check in
                    </button>
                </Drawer.Trigger>

                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-40 bg-zinc-950/45 backdrop-blur-[2px]" />
                    <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-3xl flex-col rounded-t-[2rem] border border-zinc-200 bg-white shadow-2xl outline-none">
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-zinc-200" />
                        <div className="overflow-y-auto">
                            <CheckInComposer
                                displayName={displayName}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                message={message}
                                isSubmitting={isSubmitting}
                                shouldShowLoadingSkeleton={
                                    shouldShowLoadingSkeleton
                                }
                                hasRetryAction={hasRetryAction}
                                onContinue={handleContinue}
                            />
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            <AppBottomNav />
        </main>
    )
}
