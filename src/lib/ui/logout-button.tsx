'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useFormStatus } from 'react-dom'

import { logout } from '@/app/actions/auth'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            className="rounded-full border border-white/15 bg-zinc-950/90 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-zinc-950/15 backdrop-blur transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={pending}
        >
            {pending ? 'Signing out...' : 'Log out'}
        </button>
    )
}

export function LogoutButton() {
    const queryClient = useQueryClient()
    const supabase = createBrowserSupabaseClient()

    return (
        <form
            action={logout}
            onSubmitCapture={() => {
                queryClient.clear()
                void supabase.auth.signOut({ scope: 'local' }).catch(() => {
                    // Server logout remains the source of truth.
                })
            }}
        >
            <SubmitButton />
        </form>
    )
}
