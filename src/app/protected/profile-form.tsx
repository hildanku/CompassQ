'use client'

import { useState } from 'react'

import { ApiClientError, apiFetch } from '@/lib/api'

type ProfileResponse = {
    profile: {
        displayName: string | null
        timezone: string
    }
}

type ProfileFormProps = {
    initialDisplayName: string
    initialTimezone: string
}

export function ProfileForm({
    initialDisplayName,
    initialTimezone,
}: ProfileFormProps) {
    const [displayName, setDisplayName] = useState(initialDisplayName)
    const [timezone, setTimezone] = useState(initialTimezone)
    const [message, setMessage] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSaving(true)
        setMessage(null)

        try {
            const payload = await apiFetch<ProfileResponse>('/api/v1/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ displayName, timezone }),
            })

            if (!payload.data?.profile) {
                setMessage('Failed to save profile')
                return
            }

            setDisplayName(payload.data.profile.displayName ?? '')
            setTimezone(payload.data.profile.timezone)
            setMessage(payload.message)
        } catch (error) {
            if (error instanceof ApiClientError) {
                setMessage(error.message)
                return
            }

            setMessage('Failed to save profile')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                    <span className="text-sm font-medium text-zinc-800">
                        Display name
                    </span>
                    <input
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-emerald-500"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        maxLength={80}
                        placeholder="How should we call you?"
                    />
                </label>

                <label className="block space-y-2">
                    <span className="text-sm font-medium text-zinc-800">
                        Timezone
                    </span>
                    <input
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-emerald-500"
                        value={timezone}
                        onChange={(event) => setTimezone(event.target.value)}
                        placeholder="Asia/Jakarta"
                        required
                    />
                </label>
            </div>

            <button
                className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                type="submit"
                disabled={isSaving}
            >
                {isSaving ? 'Saving...' : 'Save profile'}
            </button>

            {message ? (
                <p className="text-sm text-zinc-600">{message}</p>
            ) : null}
        </form>
    )
}
