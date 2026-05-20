'use client'

import { useCallback, useEffect, useState } from 'react'

type QfSessionStatus = {
    connected: boolean
    expiresAt: number | null
    hasRefreshToken: boolean
}

export function QfConnectCard() {
    const [status, setStatus] = useState<QfSessionStatus | null>(null)
    const [loading, setLoading] = useState(true)

    const checkSession = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/qf/session')
            const data = (await response.json()) as QfSessionStatus
            setStatus(data)
        } catch {
            setStatus({ connected: false, expiresAt: null, hasRefreshToken: false })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void checkSession()
    }, [checkSession])

    const handleConnect = () => {
        window.location.href = '/api/auth/qf/start?next=/profile'
    }

    const handleDisconnect = async () => {
        await fetch('/api/auth/qf/session', { method: 'DELETE' })
        setStatus({ connected: false, expiresAt: null, hasRefreshToken: false })
    }

    if (loading) {
        return (
            <div className="animate-pulse rounded-3xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(250,250,249,0.94))] p-4">
                <div className="h-4 w-32 rounded bg-zinc-200" />
                <div className="mt-2 h-3 w-48 rounded bg-zinc-100" />
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(250,250,249,0.94))] p-4">
            <dt className="font-medium text-zinc-900">
                Quran.com Account
            </dt>
            <dd className="mt-1 text-sm text-zinc-600">
                {status?.connected ? (
                    <span className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        Connected - bookmarks sync to Quran.com
                    </span>
                ) : (
                    <span className="text-zinc-500">
                        Not connected - bookmarks are saved locally only
                    </span>
                )}
            </dd>
            <div className="mt-3">
                {status?.connected ? (
                    <button
                        type="button"
                        onClick={handleDisconnect}
                        className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-red-200 hover:text-red-600"
                    >
                        Disconnect
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleConnect}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                        Connect Quran.com
                    </button>
                )}
            </div>
        </div>
    )
}
