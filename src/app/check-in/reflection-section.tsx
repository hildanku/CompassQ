'use client'

import { type SessionCompletionResponse } from '@/lib/queries/moments'

export function ReflectionSection({
    reflectionDraft,
    reflectionError,
    reflectionStep,
    submittedReflectionLength,
    completionSummary,
    isSavingReflection,
    onReflectionDraftChange,
    onSubmitReflection,
    onWriteAnotherReflection,
    onStartAnotherCheckIn,
}: {
    reflectionDraft: string
    reflectionError: string | null
    reflectionStep: 'compose' | 'next'
    submittedReflectionLength: number | null
    completionSummary: SessionCompletionResponse['streak'] | null
    isSavingReflection: boolean
    onReflectionDraftChange: (value: string) => void
    onSubmitReflection: () => void
    onWriteAnotherReflection: () => void
    onStartAnotherCheckIn: () => void
}) {
    return (
        <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                    Reflection
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                    Capture this moment in one line.
                </h2>
                <p className="text-sm leading-6 text-zinc-600 sm:text-base">
                    Reflection is optional. You can continue with an empty line
                    or save a short note up to 280 characters.
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
                                onReflectionDraftChange(event.target.value)
                            }}
                            placeholder="What stands out for you right now?"
                            className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                        <p>{reflectionDraft.length}/280 characters</p>
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
                                onClick={onSubmitReflection}
                                disabled={isSavingReflection}
                                className="mt-3 rounded-full border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Retry reflection submit
                            </button>
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={onSubmitReflection}
                        disabled={isSavingReflection}
                        className="w-full rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                    >
                        {isSavingReflection
                            ? 'Saving reflection...'
                            : reflectionDraft.trim().length === 0
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
                            Reflection captured for this session.
                        </h3>
                        <p className="text-sm leading-6 text-emerald-900/80 sm:text-base">
                            {submittedReflectionLength === 0
                                ? 'You continued without adding text, and the session still recorded an empty reflection entry.'
                                : 'Your reflection has been saved. You can keep moving forward from this Quran Moment.'}
                        </p>
                        {completionSummary ? (
                            <p className="text-sm leading-6 text-emerald-900/80 sm:text-base">
                                Return streak: {completionSummary.current} day
                                {completionSummary.current === 1
                                    ? ''
                                    : 's'}{' '}
                                current, {completionSummary.longest} day
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
                            onClick={onWriteAnotherReflection}
                            className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
                        >
                            Write another reflection
                        </button>
                        <button
                            type="button"
                            onClick={onStartAnotherCheckIn}
                            className="rounded-full bg-emerald-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
                        >
                            Start another check-in
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}
