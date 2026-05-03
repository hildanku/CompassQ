'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { ApiClientError } from '@/lib/api'
import {
    fetchProfile,
    profileQueryKey,
    type EditableProfile,
    updateProfile,
} from '@/lib/queries/profile'

type ProfileFormProps = {
    initialProfile: EditableProfile
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
    const queryClient = useQueryClient()
    const [message, setMessage] = useState<string | null>(null)
    const [displayName, setDisplayName] = useState(
        initialProfile.displayName ?? '',
    )
    const [timezone, setTimezone] = useState(initialProfile.timezone)

    useQuery({
        queryKey: profileQueryKey,
        queryFn: fetchProfile,
        initialData: initialProfile,
    })

    const saveProfileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: async ({ message: successMessage, profile }) => {
            queryClient.setQueryData(profileQueryKey, profile)
            setDisplayName(profile.displayName ?? '')
            setTimezone(profile.timezone)
            setMessage(successMessage)
            await queryClient.invalidateQueries({ queryKey: profileQueryKey })
        },
        onError: (error) => {
            if (error instanceof ApiClientError) {
                setMessage(error.message)
                return
            }

            setMessage('Failed to save profile')
        },
    })

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setMessage(null)

        await saveProfileMutation.mutateAsync({
            displayName,
            timezone,
        })
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
                        disabled={saveProfileMutation.isPending}
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
                        disabled={saveProfileMutation.isPending}
                    />
                </label>
            </div>

            <button
                className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                type="submit"
                disabled={saveProfileMutation.isPending}
            >
                {saveProfileMutation.isPending ? 'Saving...' : 'Save profile'}
            </button>

            {message ? (
                <p className="text-sm text-zinc-600">{message}</p>
            ) : null}
        </form>
    )
}
