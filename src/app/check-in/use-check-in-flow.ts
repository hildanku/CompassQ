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

export type ActiveMoment = {
    checkInId: string
    sessionId: string
    category: CheckInCategory
    ayah: RecommendedAyah
}

function getReflectionDraftStorageKey(sessionId: string) {
    return `compassq:reflection-draft:${sessionId}`
}

export function useCheckInFlow() {
    const queryClient = useQueryClient()
    const [selectedCategory, setSelectedCategory] =
        useState<CheckInCategory>('anxiety')
    const [message, setMessage] = useState<string | null>(null)
    const [activeMoment, setActiveMoment] = useState<ActiveMoment | null>(null)
    const [reflectionDraft, setReflectionDraft] = useState('')
    const [reflectionError, setReflectionError] = useState<string | null>(null)
    const [reflectionStep, setReflectionStep] = useState<'compose' | 'next'>(
        'compose',
    )
    const [submittedReflectionLength, setSubmittedReflectionLength] = useState<
        number | null
    >(null)
    const [savedReflectionForSessionId, setSavedReflectionForSessionId] =
        useState<string | null>(null)
    const [completionSummary, setCompletionSummary] = useState<
        SessionCompletionResponse['streak'] | null
    >(null)

    function resetReflectionComposer(sessionId?: string) {
        const storedDraft =
            sessionId && typeof window !== 'undefined'
                ? (window.localStorage.getItem(
                      getReflectionDraftStorageKey(sessionId),
                  ) ?? '')
                : ''

        setReflectionDraft(storedDraft)
        setReflectionError(null)
        setReflectionStep('compose')
        setSubmittedReflectionLength(null)
        setSavedReflectionForSessionId(null)
        setCompletionSummary(null)
    }

    const createCheckInMutation = useMutation({
        mutationFn: createCheckIn,
        onError: (error) => {
            if (error instanceof ApiClientError) {
                setMessage(error.message)
                return
            }

            setMessage('Failed to save your check-in. Please try again.')
        },
    })

    const recommendMomentMutation = useMutation({
        mutationFn: recommendMoment,
        onError: (error) => {
            if (error instanceof ApiClientError) {
                setMessage(error.message)
                return
            }

            setMessage('Failed to load your Quran Moment. Please try again.')
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
                setReflectionError(error.message)
            } else {
                setReflectionError(
                    'Failed to save your reflection. Please try again.',
                )
            }

            if (activeMoment && typeof window !== 'undefined') {
                window.localStorage.setItem(
                    getReflectionDraftStorageKey(activeMoment.sessionId),
                    reflectionDraft,
                )
            }
        },
        onSuccess: () => {
            if (activeMoment && typeof window !== 'undefined') {
                window.localStorage.removeItem(
                    getReflectionDraftStorageKey(activeMoment.sessionId),
                )
            }

            setSubmittedReflectionLength(reflectionDraft.trim().length)
            setReflectionError(null)
            setSavedReflectionForSessionId(activeMoment?.sessionId ?? null)
        },
    })

    const completeSessionMutation = useMutation({
        mutationFn: completeSession,
        onSuccess: async (completion) => {
            setCompletionSummary(completion.streak)
            setReflectionDraft('')
            setReflectionError(null)
            setReflectionStep('next')
            await queryClient.invalidateQueries({
                queryKey: historyQueryKey(10),
            })
        },
        onError: (error) => {
            if (error instanceof ApiClientError) {
                setReflectionError(error.message)
                return
            }

            setReflectionError('Failed to complete this session. Please retry.')
        },
    })

    async function handleContinue() {
        setMessage(null)
        setActiveMoment(null)
        resetReflectionComposer()

        try {
            const checkIn =
                await createCheckInMutation.mutateAsync(selectedCategory)
            const moment = await recommendMomentMutation.mutateAsync(
                checkIn.checkInId,
            )

            setActiveMoment({
                checkInId: checkIn.checkInId,
                sessionId: moment.sessionId,
                category: checkIn.category,
                ayah: moment.ayah,
            })
            resetReflectionComposer(moment.sessionId)
            setMessage(null)
        } catch {
            // Error state is already handled by the mutation callbacks.
        }
    }

    function handleStartAnotherCheckIn() {
        setActiveMoment(null)
        setMessage(null)
        resetReflectionComposer()
    }

    async function handleSubmitReflection() {
        if (!activeMoment) {
            return
        }

        setReflectionError(null)

        try {
            if (savedReflectionForSessionId === activeMoment.sessionId) {
                await completeSessionMutation.mutateAsync(
                    activeMoment.sessionId,
                )
                return
            }

            await createReflectionMutation.mutateAsync({
                sessionId: activeMoment.sessionId,
                content: reflectionDraft,
            })
            await completeSessionMutation.mutateAsync(activeMoment.sessionId)
        } catch {
            // Error state is already handled by the mutation callback.
        }
    }

    function handleWriteAnotherReflection() {
        setReflectionDraft('')
        setReflectionError(null)
        setReflectionStep('compose')
        setSubmittedReflectionLength(null)
    }

    function handleReflectionDraftChange(value: string) {
        setReflectionDraft(value)

        if (reflectionError) {
            setReflectionError(null)
        }
    }

    const activeSessionId = activeMoment?.sessionId ?? null

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
        selectedCategory,
        setSelectedCategory,
        message,
        activeMoment,
        reflectionDraft,
        reflectionError,
        reflectionStep,
        submittedReflectionLength,
        completionSummary,
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
            Boolean(message) &&
            !(
                createCheckInMutation.isPending ||
                recommendMomentMutation.isPending
            ),
        handleContinue,
        handleStartAnotherCheckIn,
        handleSubmitReflection,
        handleWriteAnotherReflection,
        handleReflectionDraftChange,
    }
}
