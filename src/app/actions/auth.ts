'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@/lib/supabase/server'

function isMissingSessionError(
    error: { name?: string; message?: string; code?: string } | null,
) {
    if (!error) {
        return false
    }

    return (
        error.name === 'AuthSessionMissingError' ||
        error.message === 'Auth session missing!' ||
        error.code === 'refresh_token_not_found' ||
        error.message?.includes('Invalid Refresh Token')
    )
}

export async function logout() {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error && !isMissingSessionError(error)) {
        throw error
    }

    revalidatePath('/', 'layout')
    redirect('/login')
}
