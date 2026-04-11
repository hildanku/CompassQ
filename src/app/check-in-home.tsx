'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { HistorySection } from '@/app/history/history-section'
import { ApiClientError } from '@/lib/api'
import { checkInCategoryValues } from '@/lib/contracts'
import {
    completeSession,
    createCheckIn,
    createReflection,
    fetchHistory,
    historyQueryKey,
    recommendMoment,
    type CheckInCategory,
    type RecommendedAyah,
    type SessionCompletionResponse,
} from '@/lib/queries/moments'
import {
    bookmarksQueryKey,
    createBookmark,
    fetchBookmarks,
    removeBookmark,
} from '@/lib/queries/save-actions'

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

type ActiveMoment = {
    checkInId: string
    sessionId: string
    category: CheckInCategory
    ayah: RecommendedAyah
}

function getReflectionDraftStorageKey(sessionId: string) {
    return `compassq:reflection-draft:${sessionId}`
}

type CheckInHomeProps = {
    displayName: string | null
}

function formatAudioTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '0:00'
    }

    const wholeSeconds = Math.floor(seconds)
    const minutes = Math.floor(wholeSeconds / 60)
    const remainingSeconds = wholeSeconds % 60

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function SaveActions({ ayahKey }: { ayahKey: string }) {
    const queryClient = useQueryClient()
    const [message, setMessage] = useState<string | null>(null)

    const bookmarksQuery = useQuery({
        queryKey: bookmarksQueryKey,
        queryFn: fetchBookmarks,
    })

    const bookmarkMutation = useMutation({
        mutationFn: createBookmark,
        onSuccess: async (data) => {
            setMessage(
                data.created
                    ? `Ayah ${data.ayahKey} bookmarked.`
                    : `Ayah ${data.ayahKey} was already bookmarked.`,
            )
            await queryClient.invalidateQueries({
                queryKey: bookmarksQueryKey,
            })
        },
        onError: (error) => {
            setMessage(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to bookmark this ayah.',
            )
        },
    })

    const removeBookmarkMutation = useMutation({
        mutationFn: removeBookmark,
        onSuccess: async (data) => {
            setMessage(`Bookmark removed for ayah ${data.ayahKey}.`)
            await queryClient.invalidateQueries({
                queryKey: bookmarksQueryKey,
            })
        },
        onError: (error) => {
            setMessage(
                error instanceof ApiClientError
                    ? error.message
                    : 'Failed to remove bookmark.',
            )
        },
    })

    const bookmarks = bookmarksQuery.data ?? []
    const existingBookmark = bookmarks.find(
        (bookmark) => bookmark.ayahKey === ayahKey,
    )
    const isBookmarked = Boolean(existingBookmark)
    const isMutating =
        bookmarkMutation.isPending || removeBookmarkMutation.isPending

    return (
        <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                        Save actions
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                        Keep this ayah close.
                    </h2>
                    <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                        Bookmark it instantly, or move it into a collection on a
                        separate saved page.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setMessage(null)

                            if (isBookmarked) {
                                void removeBookmarkMutation.mutateAsync(ayahKey)
                                return
                            }

                            void bookmarkMutation.mutateAsync(ayahKey)
                        }}
                        disabled={isMutating}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isBookmarked
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                                : 'bg-zinc-950 text-white hover:bg-zinc-800'
                        }`}
                    >
                        {isMutating
                            ? 'Saving...'
                            : isBookmarked
                              ? 'Bookmarked'
                              : 'Bookmark instantly'}
                    </button>

                    <Link
                        href={`/saved?ayahKey=${encodeURIComponent(ayahKey)}`}
                        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                        Add to collection
                    </Link>
                </div>
            </div>

            {bookmarksQuery.error instanceof ApiClientError ? (
                <p className="mt-4 text-sm text-zinc-600">
                    {bookmarksQuery.error.message}
                </p>
            ) : null}

            {message ? (
                <p className="mt-4 text-sm text-zinc-600">{message}</p>
            ) : null}
        </section>
    )
}

export function CheckInHome({ displayName }: CheckInHomeProps) {
    const queryClient = useQueryClient()
    const [selectedCategory, setSelectedCategory] =
        useState<CheckInCategory>('anxiety')
    const [message, setMessage] = useState<string | null>(null)
    const [activeMoment, setActiveMoment] = useState<ActiveMoment | null>(null)
    const [audioCurrentTime, setAudioCurrentTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    const [isAudioPlaying, setIsAudioPlaying] = useState(false)
    const [hasAudioPlaybackError, setHasAudioPlaybackError] = useState(false)
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
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const historyQuery = useQuery({
        queryKey: historyQueryKey(10),
        queryFn: () => fetchHistory(10),
    })

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
        setAudioCurrentTime(0)
        setAudioDuration(0)
        setIsAudioPlaying(false)
        setHasAudioPlaybackError(false)
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
        audioRef.current?.pause()
        setActiveMoment(null)
        setMessage(null)
        setAudioCurrentTime(0)
        setAudioDuration(0)
        setIsAudioPlaying(false)
        setHasAudioPlaybackError(false)
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

    const isSubmitting =
        createCheckInMutation.isPending || recommendMomentMutation.isPending
    const activeSessionId = activeMoment?.sessionId ?? null

    useEffect(() => {
        const audio = audioRef.current

        if (!audio || !activeMoment?.ayah.audioUrl) {
            return
        }

        const syncCurrentTime = () => {
            setAudioCurrentTime(audio.currentTime)
        }

        const syncDuration = () => {
            setAudioDuration(
                Number.isFinite(audio.duration) ? audio.duration : 0,
            )
        }

        const handlePlay = () => {
            setIsAudioPlaying(true)
            setHasAudioPlaybackError(false)
        }

        const handlePause = () => {
            setIsAudioPlaying(false)
        }

        const handleEnded = () => {
            setIsAudioPlaying(false)
            setAudioCurrentTime(audio.duration || 0)
        }

        const handleError = () => {
            setIsAudioPlaying(false)
            setHasAudioPlaybackError(true)
        }

        syncCurrentTime()
        syncDuration()

        audio.addEventListener('timeupdate', syncCurrentTime)
        audio.addEventListener('loadedmetadata', syncDuration)
        audio.addEventListener('durationchange', syncDuration)
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        return () => {
            audio.removeEventListener('timeupdate', syncCurrentTime)
            audio.removeEventListener('loadedmetadata', syncDuration)
            audio.removeEventListener('durationchange', syncDuration)
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
        }
    }, [activeMoment?.ayah.audioUrl])

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

    async function handleToggleAudioPlayback() {
        const audio = audioRef.current

        if (!audio) {
            return
        }

        try {
            if (audio.paused) {
                await audio.play()
            } else {
                audio.pause()
            }
        } catch {
            setIsAudioPlaying(false)
            setHasAudioPlaybackError(true)
        }
    }

    function handleSeekAudio(nextTime: number) {
        const audio = audioRef.current

        if (!audio) {
            return
        }

        audio.currentTime = nextTime
        setAudioCurrentTime(nextTime)
    }

    function handleReplayAudio() {
        const audio = audioRef.current

        if (!audio) {
            return
        }

        audio.currentTime = 0
        setAudioCurrentTime(0)
        void audio.play().catch(() => {
            setIsAudioPlaying(false)
            setHasAudioPlaybackError(true)
        })
    }

    const hasRetryAction = Boolean(message) && !isSubmitting
    const shouldShowLoadingSkeleton = isSubmitting && !activeMoment
    const hasAudio =
        Boolean(activeMoment?.ayah.audioUrl) && !hasAudioPlaybackError
    const isSavingReflection =
        createReflectionMutation.isPending || completeSessionMutation.isPending

    if (activeMoment) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#14532d,_#052e16_30%,_#022c22_55%,_#f8fafc_55%,_#ffffff)] px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
                <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col gap-6">
                    <section className="rounded-[2rem] border border-white/10 bg-white/95 p-6 shadow-2xl shadow-emerald-950/15 backdrop-blur sm:p-8">
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
                                        {categoryLabels[activeMoment.category]}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleStartAnotherCheckIn}
                                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                Start another check-in
                            </button>
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

                            {hasAudio ? (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-zinc-900">
                                        Recitation
                                    </p>
                                    <audio
                                        ref={audioRef}
                                        preload="none"
                                        className="hidden"
                                        src={activeMoment.ayah.audioUrl}
                                    >
                                        Your browser does not support audio
                                        playback.
                                    </audio>

                                    <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-[linear-gradient(180deg,_#1f1f1f_0%,_#121212_100%)] p-5 text-white shadow-xl shadow-zinc-950/20">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(29,185,84,0.7),_rgba(29,185,84,0.15)_45%,_rgba(255,255,255,0.04)_70%)] shadow-lg shadow-black/30">
                                                    <span className="text-lg font-semibold text-emerald-50">
                                                        Q
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-white">
                                                        Ayah{' '}
                                                        {
                                                            activeMoment.ayah
                                                                .ayahKey
                                                        }
                                                    </p>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                                                        Quran Moment Recitation
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                                                {isAudioPlaying
                                                    ? 'Playing'
                                                    : 'Paused'}
                                            </p>
                                        </div>

                                        <div className="mt-5 flex flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={
                                                    handleToggleAudioPlayback
                                                }
                                                className="rounded-full bg-[#1db954] px-5 py-3 text-sm font-semibold text-[#04130a] transition hover:bg-[#1ed760]"
                                            >
                                                {isAudioPlaying
                                                    ? 'Pause'
                                                    : 'Play'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleReplayAudio}
                                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                                            >
                                                Replay
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSeekAudio(
                                                        Math.max(
                                                            audioCurrentTime -
                                                                10,
                                                            0,
                                                        ),
                                                    )
                                                }
                                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                                            >
                                                Back 10s
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSeekAudio(
                                                        Math.min(
                                                            audioCurrentTime +
                                                                10,
                                                            audioDuration ||
                                                                audioCurrentTime +
                                                                    10,
                                                        ),
                                                    )
                                                }
                                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                                            >
                                                Forward 10s
                                            </button>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                                                <span>
                                                    {formatAudioTime(
                                                        audioCurrentTime,
                                                    )}
                                                </span>
                                                <span>
                                                    {formatAudioTime(
                                                        audioDuration,
                                                    )}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max={Math.max(audioDuration, 0)}
                                                step="1"
                                                value={Math.min(
                                                    audioCurrentTime,
                                                    audioDuration ||
                                                        audioCurrentTime,
                                                )}
                                                onChange={(event) =>
                                                    handleSeekAudio(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="w-full accent-[#1db954]"
                                                aria-label="Seek recitation"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-600">
                                    Recitation is unavailable right now, but the
                                    verse remains fully readable.
                                </div>
                            )}
                        </div>

                        <div className="mt-5 grid gap-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-600 sm:grid-cols-2">
                            <p>Check-in ID: {activeMoment.checkInId}</p>
                            <p>Session ID: {activeMoment.sessionId}</p>
                        </div>

                        <SaveActions ayahKey={activeMoment.ayah.ayahKey} />

                        <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-5 sm:p-6">
                            <div className="space-y-2">
                                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                                    Reflection
                                </p>
                                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                                    Capture this moment in one line.
                                </h2>
                                <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                                    Reflection is optional. You can continue
                                    with an empty line or save a short note up
                                    to 280 characters.
                                </p>
                            </div>

                            {reflectionStep === 'compose' ? (
                                <div className="mt-5 space-y-4">
                                    <label className="block space-y-2">
                                        <span className="text-sm font-medium text-zinc-900">
                                            Your reflection
                                        </span>
                                        <input
                                            type="text"
                                            value={reflectionDraft}
                                            maxLength={280}
                                            onChange={(event) => {
                                                setReflectionDraft(
                                                    event.target.value,
                                                )
                                                if (reflectionError) {
                                                    setReflectionError(null)
                                                }
                                            }}
                                            placeholder="What stands out for you right now?"
                                            className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                        />
                                    </label>

                                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                                        <p>
                                            {reflectionDraft.length}/280
                                            characters
                                        </p>
                                        <p>
                                            {reflectionDraft.trim().length === 0
                                                ? 'Empty reflection will still be saved.'
                                                : 'Single-line reflection only.'}
                                        </p>
                                    </div>

                                    {reflectionError ? (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                                            <p>{reflectionError}</p>
                                            <button
                                                type="button"
                                                onClick={handleSubmitReflection}
                                                disabled={isSavingReflection}
                                                className="mt-3 rounded-full border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Retry reflection submit
                                            </button>
                                        </div>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={handleSubmitReflection}
                                        disabled={isSavingReflection}
                                        className="w-full rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                                    >
                                        {isSavingReflection
                                            ? 'Saving reflection...'
                                            : reflectionDraft.trim().length ===
                                                0
                                              ? 'Continue without reflection'
                                              : 'Save reflection and continue'}
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4 rounded-[1.75rem] bg-emerald-50 p-5 text-emerald-950">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                                            Next step ready
                                        </p>
                                        <h3 className="text-xl font-semibold tracking-tight">
                                            Reflection captured for this
                                            session.
                                        </h3>
                                        <p className="text-sm leading-6 text-emerald-900/80 sm:text-base">
                                            {submittedReflectionLength === 0
                                                ? 'You continued without adding text, and the session still recorded an empty reflection entry.'
                                                : 'Your reflection has been saved. You can keep moving forward from this Quran Moment.'}
                                        </p>
                                        {completionSummary ? (
                                            <p className="text-sm leading-6 text-emerald-900/80 sm:text-base">
                                                Return streak:{' '}
                                                {completionSummary.current} day
                                                {completionSummary.current === 1
                                                    ? ''
                                                    : 's'}{' '}
                                                current,{' '}
                                                {completionSummary.longest} day
                                                {completionSummary.longest === 1
                                                    ? ''
                                                    : 's'}{' '}
                                                longest.
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={
                                                handleWriteAnotherReflection
                                            }
                                            className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
                                        >
                                            Write another reflection
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleStartAnotherCheckIn}
                                            className="rounded-full bg-emerald-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
                                        >
                                            Start another check-in
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </section>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#14532d,_#052e16_30%,_#022c22_55%,_#f8fafc_55%,_#ffffff)] px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-between gap-8">
                <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/95 p-6 shadow-2xl shadow-emerald-950/15 backdrop-blur sm:p-8">
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
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {checkInCategoryValues.map((category) => {
                            const isSelected = category === selectedCategory

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCategory(category)
                                    }
                                    className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition sm:text-base ${
                                        isSelected
                                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-950/15'
                                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50'
                                    }`}
                                    aria-pressed={isSelected}
                                >
                                    {categoryLabels[category]}
                                </button>
                            )
                        })}
                    </div>

                    <div className="space-y-3 rounded-3xl bg-zinc-50 p-4 sm:p-5">
                        <p className="text-sm font-medium text-zinc-900">
                            Selected category
                        </p>
                        <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                            {categoryLabels[selectedCategory]}
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
                />
            </div>
        </main>
    )
}
