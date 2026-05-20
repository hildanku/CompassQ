'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Drawer } from 'vaul'

import { ApiClientError } from '@/lib/api'
import { checkInCategoryLabels } from '@/lib/constant'
import { checkInCategoryValues } from '@/lib/contracts'
import { getSurahName } from '@/lib/quran'
import { fetchHistory, fetchTodayCheckIn, historyQueryKey, todayCheckInQueryKey } from '@/lib/queries/moments'
import { echoesQueryKey, fetchEchoes, saveEchoesAsCollection } from '@/lib/queries/echoes'
import { HistorySection } from '@/lib/ui/history/history-section'
import { AppBottomNav } from '@/lib/ui/app-bottom-nav'
import { FeedbackMessage, type Feedback } from '@/lib/ui/feedback'

import { CheckInAudioPlayer } from './check-in-audio-player'
import { EchoesSection } from './echoes-section'
import { ReflectionSection } from './reflection-section'
import { SaveActions } from './save-actions'
import { StreakWidget } from './streak-widget'
import { useCheckInFlow } from './use-check-in-flow'
import { OnboardingTour } from '@/lib/ui/onboarding-tour'

type CheckInHomeProps = {
    displayName: string | null
}

type CheckInComposerProps = {
    displayName: string | null
    selectedCategory: (typeof checkInCategoryValues)[number]
    setSelectedCategory: (
        category: (typeof checkInCategoryValues)[number],
    ) => void
    feedback: Feedback
    isSubmitting: boolean
    shouldShowLoadingSkeleton: boolean
    hasRetryAction: boolean
    onContinue: () => void
}

function CheckInComposer({
    displayName,
    selectedCategory,
    setSelectedCategory,
    feedback,
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
                            className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition sm:text-base ${isSelected
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

                {feedback ? (
                    <div>
                        <FeedbackMessage feedback={feedback} />
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

import { type ActiveMoment } from './use-check-in-flow'
import { type SessionCompletionResponse } from '@/lib/queries/moments'
import { createBookmark } from '@/lib/queries/save-actions'

type CheckInHomeActiveMomentProps = {
    activeMoment: ActiveMoment
    surahName: string
    isSessionCompleted: boolean
    reflectionDraft: string
    reflectionError: string | null
    reflectionStep: 'compose' | 'next'
    submittedReflectionLength: number | null
    completionSummary: SessionCompletionResponse['streak'] | null
    resonanceScore: number | null
    isSavingReflection: boolean
    hasCheckedInToday: boolean
    isCheckInDrawerOpen: boolean
    setIsCheckInDrawerOpen: (open: boolean) => void
    handleReflectionDraftChange: (value: string) => void
    handleSubmitReflection: () => void
    handleWriteAnotherReflection: () => void
    handleStartAnotherCheckIn: () => void
    setResonanceScore: (score: number | null) => void
}

function CheckInHomeActiveMoment({
    activeMoment,
    surahName,
    isSessionCompleted,
    reflectionDraft,
    reflectionError,
    reflectionStep,
    submittedReflectionLength,
    completionSummary,
    resonanceScore,
    isSavingReflection,
    hasCheckedInToday,
    isCheckInDrawerOpen,
    setIsCheckInDrawerOpen,
    handleReflectionDraftChange,
    handleSubmitReflection,
    handleWriteAnotherReflection,
    handleStartAnotherCheckIn,
    setResonanceScore,
}: CheckInHomeActiveMomentProps) {
    const [collectionSaved, setCollectionSaved] = useState(false)

    const echoesQuery = useQuery({
        queryKey: echoesQueryKey(activeMoment.sessionId),
        queryFn: () => fetchEchoes(activeMoment.sessionId),
        enabled: isSessionCompleted,
    })

    const saveCollectionMutation = useMutation({
        mutationFn: () =>
            saveEchoesAsCollection(
                activeMoment.sessionId,
                (echoesQuery.data?.echoes ?? []).map((e) => e.ayahKey),
            ),
        onSuccess: () => {
            setCollectionSaved(true)
        },
    })

    const bookmarkMutation = useMutation({
        mutationFn: createBookmark,
    })

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
                                    {checkInCategoryLabels[activeMoment.category]}
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
                                Tafsir snippet is unavailable for this moment,
                                but you can keep reading and listening.
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
                        submittedReflectionLength={submittedReflectionLength}
                        completionSummary={completionSummary}
                        resonanceScore={resonanceScore}
                        isSavingReflection={isSavingReflection}
                        onReflectionDraftChange={handleReflectionDraftChange}
                        onSubmitReflection={handleSubmitReflection}
                        onWriteAnotherReflection={handleWriteAnotherReflection}
                        onStartAnotherCheckIn={handleStartAnotherCheckIn}
                        onResonanceScoreChange={setResonanceScore}
                    />

                    {isSessionCompleted ? (
                        <EchoesSection
                            echoes={echoesQuery.data?.echoes ?? []}
                            isLoading={echoesQuery.isLoading}
                            isSavingCollection={saveCollectionMutation.isPending}
                            collectionSaved={collectionSaved}
                            onBookmark={(ayahKey) => {
                                void bookmarkMutation.mutateAsync(ayahKey)
                            }}
                            onSaveAsCollection={() => {
                                void saveCollectionMutation.mutateAsync()
                            }}
                        />
                    ) : null}
                </section>
            </div>

            <AppBottomNav onCheckIn={() => setIsCheckInDrawerOpen(true)} checkInDisabled={hasCheckedInToday} />
        </main>
    )
}

export function CheckInHome({ displayName }: CheckInHomeProps) {
    const [isCheckInDrawerOpen, setIsCheckInDrawerOpen] = useState(false)
    const todayCheckInQuery = useQuery({
        queryKey: todayCheckInQueryKey,
        queryFn: fetchTodayCheckIn,
    })
    const hasCheckedInToday = todayCheckInQuery.data?.exists ?? false
    const historyQuery = useQuery({
        queryKey: historyQueryKey(10),
        queryFn: () => fetchHistory(10),
    })

    const {
        selectedCategory,
        setSelectedCategory,
        feedback,
        activeMoment,
        reflectionDraft,
        reflectionError,
        reflectionStep,
        submittedReflectionLength,
        completionSummary,
        resonanceScore,
        setResonanceScore,
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
        const isSessionCompleted = completionSummary !== null

        return (
            <CheckInHomeActiveMoment
                activeMoment={activeMoment}
                surahName={surahName}
                isSessionCompleted={isSessionCompleted}
                reflectionDraft={reflectionDraft}
                reflectionError={reflectionError}
                reflectionStep={reflectionStep}
                submittedReflectionLength={submittedReflectionLength}
                completionSummary={completionSummary}
                resonanceScore={resonanceScore}
                isSavingReflection={isSavingReflection}
                hasCheckedInToday={hasCheckedInToday}
                isCheckInDrawerOpen={isCheckInDrawerOpen}
                setIsCheckInDrawerOpen={setIsCheckInDrawerOpen}
                handleReflectionDraftChange={handleReflectionDraftChange}
                handleSubmitReflection={handleSubmitReflection}
                handleWriteAnotherReflection={handleWriteAnotherReflection}
                handleStartAnotherCheckIn={handleStartAnotherCheckIn}
                setResonanceScore={setResonanceScore}
            />
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

                    <StreakWidget />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            data-tour="checkin-button"
                            onClick={() => {
                                setIsCheckInDrawerOpen(true)
                            }}
                            disabled={hasCheckedInToday}
                            className={`rounded-2xl px-5 py-4 text-sm font-semibold transition ${hasCheckedInToday
                                    ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                                    : 'bg-zinc-950 text-white hover:bg-zinc-800'
                                }`}
                        >
                            {hasCheckedInToday
                                ? "You've checked in today"
                                : "Start today's check-in"}
                        </button>
                        <p className="text-sm leading-6 text-zinc-500">
                            One primary check-in each day. If you already
                            started today, we will continue that Quran Moment.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            {
                                step: '01',
                                label: 'Check in',
                                desc: 'Start with the moment that feels closest right now.',
                            },
                            {
                                step: '02',
                                label: 'Receive',
                                desc: 'Open your Quran Moment with ayah, translation, and recitation.',
                            },
                            {
                                step: '03',
                                label: 'Revisit',
                                desc: 'Return to recent sessions anytime from your history.',
                            },
                        ].map(({ step, label, desc }) => (
                            <article
                                key={step}
                                className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                                    {step}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-zinc-900">
                                    {label}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-zinc-600">
                                    {desc}
                                </p>
                            </article>
                        ))}
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
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-40 bg-zinc-950/45 backdrop-blur-[2px]" />
                    <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-3xl flex-col rounded-t-4xl border border-zinc-200 bg-white shadow-2xl outline-none">
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-zinc-200" />
                        <div className="overflow-y-auto">
                            <CheckInComposer
                                displayName={displayName}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                feedback={feedback}
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

            <AppBottomNav onCheckIn={() => setIsCheckInDrawerOpen(true)} checkInDisabled={hasCheckedInToday} />

            <OnboardingTour isFirstUser={!historyQuery.isLoading && (historyQuery.data?.sessions.length ?? 0) === 0} />
        </main>
    )
}
