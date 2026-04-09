import { ApiClientError, apiFetch } from '@/lib/api'

export type EditableProfile = {
    displayName: string | null
    timezone: string
}

type ProfileResponse = {
    profile: EditableProfile
}

export const profileQueryKey = ['profile'] as const

export async function fetchProfile() {
    const payload = await apiFetch<ProfileResponse>('/api/v1/profile')

    if (!payload.data?.profile) {
        throw new ApiClientError('Failed to load profile', {
            status: 500,
            payload,
        })
    }

    return payload.data.profile
}

export async function updateProfile(profile: EditableProfile) {
    const payload = await apiFetch<ProfileResponse>('/api/v1/profile', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
    })

    if (!payload.data?.profile) {
        throw new ApiClientError('Failed to save profile', {
            status: 500,
            payload,
        })
    }

    return {
        message: payload.message,
        profile: payload.data.profile,
    }
}
