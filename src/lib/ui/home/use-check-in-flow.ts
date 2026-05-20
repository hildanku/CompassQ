'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { ApiClientError } from '@/lib/api'
import {
    completeSession,
    createCheckIn,
    createReflection,
    historyQueryKey,
    recommendMoment,
    type CheckInCategory,
    type RecommendedAyah,
    type SessionCompletionResponse,
} from '@/lib/queries/moments'
import { type Feedback, useFeedbackState } from '@/lib/ui/feedback'

export type ActiveMoment = {
    checkInId: string
    sessionId: string
    category: CheckInCategory
    ayah: RecommendedAyah
}

type ReflectionStep = 'compose' | 'next'

type FeedbackState = {
    feedback: Feedback
    reflectionError: string | null
    clearFeedback: () => void
    error: (message: string) => void
    info: (message: string) => void
    clearReflectionError: () => void
    setReflectionError: (value: string | null) => void
}

type ReflectionComposerState = {
    reflectionDraft: string
    reflectionStep: ReflectionStep
    submittedReflectionLength: number | null
    savedReflectionForSessionId: string | null
    completionSummary: SessionCompletionResponse['streak'] | null
    resonanceScore: number | null
    handleReflectionDraftChange: (value: string) => void
    handleWriteAnotherReflection: () => void
    resetReflectionComposer: (sessionId?: string) => void
    markReflectionSaved: (sessionId: string, content: string) => void
    markSessionCompleted: (
        completion: SessionCompletionResponse['streak'],
    ) => void
    setResonanceScore: (score: number | null) => void
}

function getReflectionDraftStorageKey(sessionId: string) {
    return `compassq:reflection-draft:${sessionId}`
}

function getStoredReflectionDraft(sessionId?: string) {
    if (!sessionId || typeof window === 'undefined') {
        return ''
    }

    return window.localStorage.getItem(getReflectionDraftStorageKey(sessionId)) ?? ''
}

function useCheckInFeedback(): FeedbackState {
    const feedback = useFeedbackState()
    const [reflectionError, setReflectionError] = useState<string | null>(null)

    return {
        feedback: feedback.value,
        reflectionError,
        clearFeedback: feedback.clear,
        error: feedback.error,
        info: feedback.info,
        clearReflectionError: () => setReflectionError(null),
        setReflectionError,
    }
}

function useReflectionDraftPersistence(
    activeSessionId: string | null,
    clearReflectionError: () => void,
): ReflectionComposerState {
    const [reflectionDraft, setReflectionDraft] = useState('')
    const [reflectionStep, setReflectionStep] = useState<ReflectionStep>('compose')
    const [submittedReflectionLength, setSubmittedReflectionLength] = useState<
        number | null
    >(null)
    const [savedReflectionForSessionId, setSavedReflectionForSessionId] =
        useState<string | null>(null)
    const [completionSummary, setCompletionSummary] = useState<
        SessionCompletionResponse['streak'] | null
    >(null)
    const [resonanceScore, setResonanceScore] = useState<number | null>(null)

    function resetReflectionComposer(sessionId?: string) {
        setReflectionDraft(getStoredReflectionDraft(sessionId))
        clearReflectionError()
        setReflectionStep('compose')
        setSubmittedReflectionLength(null)
        setSavedReflectionForSessionId(null)
        setCompletionSummary(null)
        setResonanceScore(null)
    }

    function markReflectionSaved(sessionId: string, content: string) {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(getReflectionDraftStorageKey(sessionId))
        }

        setSubmittedReflectionLength(content.trim().length)
        clearReflectionError()
        setSavedReflectionForSessionId(sessionId)
    }

    function markSessionCompleted(completion: SessionCompletionResponse['streak']) {
        setCompletionSummary(completion)
        setReflectionDraft('')
        clearReflectionError()
        setReflectionStep('next')
    }

    function handleWriteAnotherReflection() {
        setReflectionDraft('')
        clearReflectionError()
        setReflectionStep('compose')
        setSubmittedReflectionLength(null)
    }

    function handleReflectionDraftChange(value: string) {
        setReflectionDraft(value)
        clearReflectionError()
    }

    useEffect(() => {
        if (!activeSessionId || typeof window === 'undefined') {
            return
        }

        const storageKey = getReflectionDraftStorageKey(activeSessionId)

        if (reflectionStep === 'next' || reflectionDraft.length === 0) {
            window.localStorage.removeItem(storageKey)
            return
        }

        window.localStorage.setItem(storageKey, reflectionDraft)
    }, [activeSessionId, reflectionDraft, reflectionStep])

    return {
        reflectionDraft,
        reflectionStep,
        submittedReflectionLength,
        savedReflectionForSessionId,
        completionSummary,
        resonanceScore,
        handleReflectionDraftChange,
        handleWriteAnotherReflection,
        resetReflectionComposer,
        markReflectionSaved,
        markSessionCompleted,
        setResonanceScore,
    }
}

export function useCheckInFlow() {
    const queryClient = useQueryClient()
    const [selectedCategory, setSelectedCategory] =
        useState<CheckInCategory>('anxiety')
    const [activeMoment, setActiveMoment] = useState<ActiveMoment | null>(null)
    const feedback = useCheckInFeedback()
    const reflection = useReflectionDraftPersistence(
        activeMoment?.sessionId ?? null,
        feedback.clearReflectionError,
    )

    const createCheckInMutation = useMutation({
        mutationFn: createCheckIn,
        onError: (error) => {
            if (error instanceof ApiClientError) {
                feedback.error(error.message)
                return
            }

            feedback.error('Failed to save your check-in. Please try again.')
        },
    })

    const recommendMomentMutation = useMutation({
        mutationFn: recommendMoment,
        onError: (error) => {
            if (error instanceof ApiClientError) {
                feedback.error(error.message)
                return
            }

            feedback.error('Failed to load your Quran Moment. Please try again.')
        },
    })

    const createReflectionMutation = useMutation({
        mutationFn: ({
            sessionId,
            content,
        }: {
            sessionId: string
            content: string
        }) => createReflection(sessionId, content),
        onError: (error) => {
            if (error instanceof ApiClientError) {
                feedback.setReflectionError(error.message)
            } else {
                feedback.setReflectionError(
                    'Failed to save your reflection. Please try again.',
                )
            }

            if (activeMoment && typeof window !== 'undefined') {
                window.localStorage.setItem(
                    getReflectionDraftStorageKey(activeMoment.sessionId),
                    reflection.reflectionDraft,
                )
            }
        },
        onSuccess: () => {
            if (activeMoment) {
                reflection.markReflectionSaved(
                    activeMoment.sessionId,
                    reflection.reflectionDraft,
                )
            }
        },
    })

    const completeSessionMutation = useMutation({
        mutationFn: ({ sessionId, resonanceScore }: { sessionId: string; resonanceScore?: number | null }) =>
            completeSession(sessionId, resonanceScore),
        onSuccess: async (completion) => {
            reflection.markSessionCompleted(completion.streak)
            await queryClient.invalidateQueries({
                queryKey: historyQueryKey(10),
            })
        },
        onError: (error) => {
            if (error instanceof ApiClientError) {
                feedback.setReflectionError(error.message)
                return
            }

            feedback.setReflectionError(
                'Failed to complete this session. Please retry.',
            )
        },
    })

    async function handleContinue() {
        feedback.clearFeedback()
        setActiveMoment(null)
        reflection.resetReflectionComposer()

        try {
            const checkIn =
                await createCheckInMutation.mutateAsync(selectedCategory)

            if (checkIn.reused && checkIn.hasCompletedSession) {
                feedback.info(
                    "You've already completed today's Quran Moment. Revisit history or come back tomorrow for a new daily check-in.",
                )
                return
            }

            const moment = await recommendMomentMutation.mutateAsync(
                checkIn.checkInId,
            )

            setActiveMoment({
                checkInId: checkIn.checkInId,
                sessionId: moment.sessionId,
                category: checkIn.category,
                ayah: moment.ayah,
            })
            reflection.resetReflectionComposer(moment.sessionId)
            feedback.clearFeedback()
        } catch {
            // Error state is already handled by the mutation callbacks.
        }
    }

    function handleStartAnotherCheckIn() {
        setActiveMoment(null)
        feedback.clearFeedback()
        reflection.resetReflectionComposer()
    }

    async function handleSubmitReflection() {
        if (!activeMoment) {
            return
        }

        feedback.clearReflectionError()

        try {
            if (reflection.savedReflectionForSessionId === activeMoment.sessionId) {
                await completeSessionMutation.mutateAsync({
                    sessionId: activeMoment.sessionId,
                    resonanceScore: reflection.resonanceScore,
                })
                return
            }

            await createReflectionMutation.mutateAsync({
                sessionId: activeMoment.sessionId,
                content: reflection.reflectionDraft,
            })
            await completeSessionMutation.mutateAsync({
                sessionId: activeMoment.sessionId,
                resonanceScore: reflection.resonanceScore,
            })
        } catch {
            // Error state is already handled by the mutation callback.
        }
    }

    return {
        selectedCategory,
        setSelectedCategory,
        feedback: feedback.feedback,
        activeMoment,
        reflectionDraft: reflection.reflectionDraft,
        reflectionError: feedback.reflectionError,
        reflectionStep: reflection.reflectionStep,
        submittedReflectionLength: reflection.submittedReflectionLength,
        completionSummary: reflection.completionSummary,
        resonanceScore: reflection.resonanceScore,
        setResonanceScore: reflection.setResonanceScore,
        isSubmitting:
            createCheckInMutation.isPending ||
            recommendMomentMutation.isPending,
        isSavingReflection:
            createReflectionMutation.isPending ||
            completeSessionMutation.isPending,
        shouldShowLoadingSkeleton:
            (createCheckInMutation.isPending ||
                recommendMomentMutation.isPending) &&
            !activeMoment,
        hasRetryAction:
            Boolean(feedback.feedback) &&
            !(
                createCheckInMutation.isPending ||
                recommendMomentMutation.isPending
            ),
        handleContinue,
        handleStartAnotherCheckIn,
        handleSubmitReflection,
        handleWriteAnotherReflection: reflection.handleWriteAnotherReflection,
        handleReflectionDraftChange: reflection.handleReflectionDraftChange,
    }
}
