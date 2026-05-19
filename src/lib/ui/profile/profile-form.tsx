'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { ApiClientError } from '@/lib/api'
import {
    profileQueryKey,
    type EditableProfile,
    updateProfile,
} from '@/lib/queries/profile'
import { FeedbackMessage, useFeedbackState } from '@/lib/ui/feedback'

type ProfileFormProps = {
    initialProfile: EditableProfile
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
    const queryClient = useQueryClient()
    const feedback = useFeedbackState()
    const [displayName, setDisplayName] = useState(
        initialProfile.displayName ?? '',
    )
    const [timezone, setTimezone] = useState(initialProfile.timezone)

    const saveProfileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: async ({ message: successMessage, profile }) => {
            queryClient.setQueryData(profileQueryKey, profile)
            setDisplayName(profile.displayName ?? '')
            setTimezone(profile.timezone)
            feedback.success(successMessage)
        },
        onError: (error) => {
            if (error instanceof ApiClientError) {
                feedback.error(error.message)
                return
            }

            feedback.error('Failed to save profile')
        },
    })

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        feedback.clear()

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
                        className="w-full rounded-2xl border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,250,249,0.98))] px-4 py-3 text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                        className="w-full rounded-2xl border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,250,249,0.98))] px-4 py-3 text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        value={timezone}
                        onChange={(event) => setTimezone(event.target.value)}
                        placeholder="Asia/Jakarta"
                        required
                        disabled={saveProfileMutation.isPending}
                    />
                </label>
            </div>

            <button
                className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                type="submit"
                disabled={saveProfileMutation.isPending}
            >
                {saveProfileMutation.isPending ? 'Saving...' : 'Save profile'}
            </button>

            <FeedbackMessage feedback={feedback.value} />
        </form>
    )
}
