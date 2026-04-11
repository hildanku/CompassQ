'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
    window.addEventListener('online', callback)
    window.addEventListener('offline', callback)

    return () => {
        window.removeEventListener('online', callback)
        window.removeEventListener('offline', callback)
    }
}

function getSnapshot() {
    return navigator.onLine
}

function getServerSnapshot() {
    return true
}

export function NetworkStatusToast() {
    const isOnline = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    )
    const [showRestoredToast, setShowRestoredToast] = useState(false)

    useEffect(() => {
        let hideTimer: ReturnType<typeof setTimeout> | null = null

        function handleOnline() {
            if (hideTimer) {
                clearTimeout(hideTimer)
            }

            setShowRestoredToast(true)
            hideTimer = setTimeout(() => setShowRestoredToast(false), 4000)
        }

        window.addEventListener('online', handleOnline)

        return () => {
            if (hideTimer) {
                clearTimeout(hideTimer)
            }

            window.removeEventListener('online', handleOnline)
        }
    }, [])

    if (isOnline && !showRestoredToast) {
        return null
    }

    const isOffline = !isOnline

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
            <div
                className={`pointer-events-auto w-full max-w-md rounded-[1.5rem] border px-4 py-4 shadow-2xl backdrop-blur ${
                    isOffline
                        ? 'border-amber-200 bg-amber-50/95 text-amber-950'
                        : 'border-emerald-200 bg-emerald-50/95 text-emerald-950'
                }`}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold">
                            {isOffline
                                ? 'You are offline right now.'
                                : 'Connection restored.'}
                        </p>
                        <p className="text-sm leading-6">
                            {isOffline
                                ? 'Some live data may fail to load. You can retry once your connection is back.'
                                : 'Live requests can run again. Retry the current page data if anything still looks stale.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-full border border-current/20 px-4 py-2 text-sm font-medium transition hover:bg-black/5"
                    >
                        Retry page
                    </button>
                </div>
            </div>
        </div>
    )
}
