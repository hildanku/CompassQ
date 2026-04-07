'use client'

import { useMemo, useState } from 'react'

import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type LoginFormProps = {
    next: string
}

export function LoginForm({ next }: LoginFormProps) {
    const supabase = useMemo(() => createBrowserSupabaseClient(), [])
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function signInWithMagicLink(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()
        setIsSubmitting(true)
        setMessage(null)

        const redirectTo = new URL('/auth/callback', window.location.origin)
        redirectTo.searchParams.set('next', next)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectTo.toString(),
                data: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            },
        })

        setIsSubmitting(false)

        if (error) {
            setMessage(error.message)
            return
        }

        setMessage('Magic link sent. Check your inbox to continue.')
    }

    async function signInWithOAuth(provider: 'google' | 'github') {
        setIsSubmitting(true)
        setMessage(null)

        const redirectTo = new URL('/auth/callback', window.location.origin)
        redirectTo.searchParams.set('next', next)

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: redirectTo.toString(),
            },
        })

        if (error) {
            setIsSubmitting(false)
            setMessage(error.message)
        }
    }

    return (
        <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm shadow-emerald-950/5">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                    Masuk ke CompassQ
                </h1>
                <p className="text-sm leading-6 text-zinc-600">
                    Lanjutkan dengan email agar kamu bisa menyimpan refleksi,
                    bookmark ayat, dan melanjutkan perjalananmu kapan pun.
                </p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={signInWithMagicLink}>
                <label className="block space-y-2">
                    <span className="text-sm font-medium text-zinc-800">
                        Email kamu
                    </span>
                    <input
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-emerald-500"
                        type="email"
                        autoComplete="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </label>

                <button
                    className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? 'Mengirim link masuk...'
                        : 'Kirim link masuk'}
                </button>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                    className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => signInWithOAuth('google')}
                    disabled={isSubmitting}
                >
                    Masuk dengan Google
                </button>
                <button
                    className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => signInWithOAuth('github')}
                    disabled={isSubmitting}
                >
                    Masuk dengan GitHub
                </button>
            </div>

            {message ? (
                <p className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                    {message}
                </p>
            ) : null}
        </div>
    )
}
