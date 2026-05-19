'use client'

import { useState } from 'react'

export type FeedbackKind = 'success' | 'error' | 'info'

export type Feedback = {
    kind: FeedbackKind
    message: string
} | null

type FeedbackMessageProps = {
    feedback: Feedback
    className?: string
}

function getFeedbackClasses(kind: FeedbackKind) {
    if (kind === 'error') {
        return 'border-amber-200 bg-amber-50 text-amber-900'
    }

    if (kind === 'success') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    }

    return 'border-zinc-200 bg-white text-zinc-700'
}

export function useFeedbackState(initialFeedback: Feedback = null) {
    const [value, setValue] = useState<Feedback>(initialFeedback)

    return {
        value,
        set: setValue,
        clear: () => setValue(null),
        success: (message: string) => {
            setValue({ kind: 'success', message })
        },
        error: (message: string) => {
            setValue({ kind: 'error', message })
        },
        info: (message: string) => {
            setValue({ kind: 'info', message })
        },
    }
}

export function FeedbackMessage({
    feedback,
    className,
}: FeedbackMessageProps) {
    if (!feedback) {
        return null
    }

    const isError = feedback.kind === 'error'

    return (
        <div
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${getFeedbackClasses(feedback.kind)}${className ? ` ${className}` : ''}`}
        >
            <p>{feedback.message}</p>
        </div>
    )
}
