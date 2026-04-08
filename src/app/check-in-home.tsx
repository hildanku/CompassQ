'use client'

import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'

import { ApiClientError, apiFetch } from '@/lib/api'
import { checkInCategoryValues } from '@/lib/contracts'

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

type CheckInCategory = (typeof checkInCategoryValues)[number]

type CheckInResponse = {
    checkInId: string
    category: CheckInCategory
    createdAt: string
    localDate: string
}

type RecommendedAyah = {
    ayahKey: string
    surahNumber: number
    ayahNumber: number
    arabicText: string
    translation: string
    tafsirSnippet: string
    audioUrl: string
}

type RecommendMomentResponse = {
    sessionId: string
    checkInId: string
    ayah: RecommendedAyah
}

type ActiveMoment = {
    checkInId: string
    sessionId: string
    category: CheckInCategory
    ayah: RecommendedAyah
}

async function createCheckIn(category: CheckInCategory) {
    const payload = await apiFetch<CheckInResponse>('/api/v1/check-ins', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
    })

    if (!payload.data) {
        throw new ApiClientError('Failed to create check-in', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

async function recommendMoment(checkInId: string) {
    const payload = await apiFetch<RecommendMomentResponse>(
        '/api/v1/moments/recommend',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ checkInId }),
        },
    )

    if (!payload.data?.ayah || !payload.data.sessionId) {
        throw new ApiClientError('Failed to load Quran Moment', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

type CheckInHomeProps = {
    displayName: string | null
}

export function CheckInHome({ displayName }: CheckInHomeProps) {
    const [selectedCategory, setSelectedCategory] =
        useState<CheckInCategory>('anxiety')
    const [message, setMessage] = useState<string | null>(null)
    const [activeMoment, setActiveMoment] = useState<ActiveMoment | null>(null)

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

    async function handleContinue() {
        setMessage(null)
        setActiveMoment(null)

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
            setMessage(null)
        } catch {
            // Error state is already handled by the mutation callbacks.
        }
    }

    function handleStartAnotherCheckIn() {
        setActiveMoment(null)
        setMessage(null)
    }

    const isSubmitting =
        createCheckInMutation.isPending || recommendMomentMutation.isPending

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
                            ) : null}

                            {activeMoment.ayah.audioUrl ? (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-zinc-900">
                                        Recitation
                                    </p>
                                    <audio
                                        controls
                                        preload="none"
                                        className="w-full"
                                        src={activeMoment.ayah.audioUrl}
                                    >
                                        Your browser does not support audio
                                        playback.
                                    </audio>
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-5 grid gap-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-600 sm:grid-cols-2">
                            <p>Check-in ID: {activeMoment.checkInId}</p>
                            <p>Session ID: {activeMoment.sessionId}</p>
                        </div>
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

                        {message ? (
                            <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-700">
                                {message}
                            </p>
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
            </div>
        </main>
    )
}
