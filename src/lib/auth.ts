import type { SupabaseClient, User } from '@supabase/supabase-js'
import { unauthorized } from 'next/navigation'

import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type ProfileRow = {
    id: string
    display_name: string | null
    timezone: string
}

function isMissingSessionError(
    error: { name?: string; message?: string } | null,
) {
    if (!error) {
        return false
    }

    return (
        error.name === 'AuthSessionMissingError' ||
        error.message === 'Auth session missing!'
    )
}

function normalizeDisplayName(value: unknown) {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()

    return trimmed ? trimmed.slice(0, 80) : null
}

function normalizeTimezone(value: unknown) {
    if (typeof value !== 'string') {
        return 'UTC'
    }

    const trimmed = value.trim()

    return trimmed || 'UTC'
}

export function getProfileValuesFromUser(user: User): ProfileRow {
    const metadata = user.user_metadata ?? {}

    return {
        id: user.id,
        display_name: normalizeDisplayName(
            metadata.display_name ?? metadata.full_name ?? metadata.name,
        ),
        timezone: normalizeTimezone(metadata.timezone),
    }
}

export async function ensureProfile(supabase: SupabaseClient, user: User) {
    const profile = getProfileValuesFromUser(user)

    const { error } = await supabase.from('profiles').upsert(profile, {
        onConflict: 'id',
        ignoreDuplicates: false,
    })

    if (error) {
        throw error
    }

    return profile
}

export async function getServerAuth() {
    if (!hasSupabaseEnv()) {
        return { supabase: null, user: null, isConfigured: false }
    }

    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) {
        if (isMissingSessionError(error)) {
            return { supabase, user: null, isConfigured: true }
        }

        throw error
    }

    if (user) {
        await ensureProfile(supabase, user)
    }

    return { supabase, user, isConfigured: true }
}

export async function requireUser() {
    const { supabase, user, isConfigured } = await getServerAuth()

    if (!isConfigured || !supabase) {
        unauthorized()
    }

    if (!user) {
        unauthorized()
    }

    return { supabase, user }
}

export function unauthorizedJson() {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export function serviceUnavailableJson() {
    return Response.json(
        { error: 'Supabase env is not configured' },
        { status: 503 },
    )
}
