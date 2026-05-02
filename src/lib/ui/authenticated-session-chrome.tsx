'use client'

import { useEffect, useMemo, useState } from 'react'

import { LogoutButton } from '@/lib/ui/logout-button'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase/env'

export function AuthenticatedSessionChrome() {
    const [hasSession, setHasSession] = useState(false)
    const isConfigured = hasSupabaseEnv()
    const supabase = useMemo(
        () => (isConfigured ? createBrowserSupabaseClient() : null),
        [isConfigured],
    )

    useEffect(() => {
        if (!supabase) {
            return
        }

        let isMounted = true

        void supabase.auth.getSession().then(({ data }) => {
            if (isMounted) {
                setHasSession(Boolean(data.session))
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isMounted) {
                setHasSession(Boolean(session))
            }
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [supabase])

    if (!hasSession) {
        return null
    }

    return (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-end px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="pointer-events-auto">
                <LogoutButton />
            </div>
        </div>
    )
}
