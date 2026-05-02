'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useFormStatus } from 'react-dom'

import { logout } from '@/app/actions/auth'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type LogoutButtonProps = {
    className: string
}

function SubmitButton({ className }: LogoutButtonProps) {
    const { pending } = useFormStatus()

    return (
        <button className={className} type="submit" disabled={pending}>
            {pending ? 'Signing out...' : 'Log out'}
        </button>
    )
}

export function LogoutButton({ className }: LogoutButtonProps) {
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
            <SubmitButton className={className} />
        </form>
    )
}
