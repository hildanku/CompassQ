'use client'

import { useEffect, useRef, useState } from 'react'

const TOUR_STORAGE_KEY = 'compassq_tour_done'

type TourStep = {
    target: string // data-tour value
    title: string
    description: string
    position: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
    {
        target: 'welcome',
        title: 'Welcome to CompassQ',
        description:
            'This quick tour will show you the key parts of the app. It only takes a moment.',
        position: 'bottom',
    },
    {
        target: 'checkin-button',
        title: 'Start your check-in',
        description:
            'Tap here to begin. You pick an emotional state and CompassQ finds a Quran verse that matches what you are carrying.',
        position: 'bottom',
    },
    {
        target: 'bottom-nav',
        title: 'Navigate the app',
        description:
            'Use the bottom bar to move between Home, History, Insights, and your Profile.',
        position: 'top',
    },
    {
        target: 'floating-checkin',
        title: 'Quick check-in shortcut',
        description:
            'This button is always available on the home screen as a fast way to start a new check-in.',
        position: 'top',
    },
]

type Rect = { top: number; left: number; width: number; height: number }

const PADDING = 10

function getTargetRect(target: string): Rect | null {
    const el = document.querySelector(`[data-tour="${target}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
    }
}

function positionTooltip(
    el: HTMLDivElement,
    rect: Rect | null,
    position: TourStep['position'],
) {
    const gap = 14
    const vw = window.innerWidth
    const vh = window.innerHeight
    const tt = el.getBoundingClientRect()

    el.style.position = 'fixed'
    el.style.transform = ''

    if (!rect) {
        el.style.top = `${(vh - tt.height) / 2}px`
        el.style.left = `${(vw - tt.width) / 2}px`
        return
    }

    let top = 0
    let left = 0

    if (position === 'bottom') {
        top = rect.top + rect.height + gap
        left = rect.left + rect.width / 2 - tt.width / 2
    } else if (position === 'top') {
        top = rect.top - tt.height - gap
        left = rect.left + rect.width / 2 - tt.width / 2
    } else if (position === 'right') {
        top = rect.top + rect.height / 2 - tt.height / 2
        left = rect.left + rect.width + gap
    } else {
        top = rect.top + rect.height / 2 - tt.height / 2
        left = rect.left - tt.width - gap
    }

    // Clamp to viewport with 12px margin
    el.style.left = `${Math.max(12, Math.min(left, vw - tt.width - 12))}px`
    el.style.top = `${Math.max(12, Math.min(top, vh - tt.height - 12))}px`
}

type TooltipProps = {
    step: TourStep
    stepIndex: number
    totalSteps: number
    rect: Rect | null
    onNext: () => void
    onSkip: () => void
}

function Tooltip({ step, stepIndex, totalSteps, rect, onNext, onSkip }: TooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null)
    const isLast = stepIndex === totalSteps - 1

    // Measure and position after render — no setState, just DOM mutation
    useEffect(() => {
        if (!tooltipRef.current) return
        const raf = requestAnimationFrame(() => {
            if (tooltipRef.current) {
                positionTooltip(tooltipRef.current, rect, step.position)
                tooltipRef.current.style.visibility = 'visible'
            }
        })
        return () => cancelAnimationFrame(raf)
    }, [rect, step.position])

    return (
        <div
            ref={tooltipRef}
            // Start invisible so there's no flash before positioning runs
            style={{ position: 'fixed', visibility: 'hidden' }}
            className="z-9999 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/60 bg-white p-5 shadow-2xl shadow-zinc-950/20"
            role="dialog"
            aria-modal="false"
            aria-label={step.title}
        >
            <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    {stepIndex + 1} / {totalSteps}
                </p>
                <button
                    type="button"
                    onClick={onSkip}
                    className="rounded-full px-2 py-0.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                >
                    Skip tour
                </button>
            </div>

            <p className="text-sm font-semibold text-zinc-950">{step.title}</p>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                {step.description}
            </p>

            <button
                type="button"
                onClick={onNext}
                className="mt-4 w-full rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
                {isLast ? 'Done' : 'Next'}
            </button>
        </div>
    )
}

type OnboardingTourProps = {
    /** Pass true only when the user has no sessions yet */
    isFirstUser: boolean
}

export function OnboardingTour({ isFirstUser }: OnboardingTourProps) {
    const [stepIndex, setStepIndex] = useState(0)
    const [active, setActive] = useState(false)
    const [rect, setRect] = useState<Rect | null>(null)

    // Decide whether to show the tour
    useEffect(() => {
        if (!isFirstUser) return
        try {
            if (localStorage.getItem(TOUR_STORAGE_KEY)) return
        } catch {
            return
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActive(true)
    }, [isFirstUser])

    // Update spotlight rect whenever step changes
    useEffect(() => {
        if (!active) return
        const step = TOUR_STEPS[stepIndex]
        const raf = requestAnimationFrame(() => {
            if (!step || step.target === 'welcome') {
                setRect(null)
                return
            }
            setRect(getTargetRect(step.target))
        })
        return () => cancelAnimationFrame(raf)
    }, [active, stepIndex])

    function dismiss() {
        setActive(false)
        try {
            localStorage.setItem(TOUR_STORAGE_KEY, '1')
        } catch {
            // ignore
        }
    }

    function handleNext() {
        if (stepIndex < TOUR_STEPS.length - 1) {
            setStepIndex((i) => i + 1)
        } else {
            dismiss()
        }
    }

    if (!active) return null

    const step = TOUR_STEPS[stepIndex]

    return (
        <>
            {rect ? (
                <svg
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-9990"
                    width="100%"
                    height="100%"
                >
                    <defs>
                        <mask id="tour-mask">
                            <rect width="100%" height="100%" fill="white" />
                            <rect
                                x={rect.left}
                                y={rect.top}
                                width={rect.width}
                                height={rect.height}
                                rx="16"
                                fill="black"
                            />
                        </mask>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="rgba(9,9,11,0.55)"
                        mask="url(#tour-mask)"
                    />
                    <rect
                        x={rect.left}
                        y={rect.top}
                        width={rect.width}
                        height={rect.height}
                        rx="16"
                        fill="none"
                        stroke="rgba(16,185,129,0.7)"
                        strokeWidth="2"
                    />
                </svg>
            ) : (
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-9990 bg-zinc-950/55"
                />
            )}

            <Tooltip
                step={step}
                stepIndex={stepIndex}
                totalSteps={TOUR_STEPS.length}
                rect={rect}
                onNext={handleNext}
                onSkip={dismiss}
            />
        </>
    )
}
