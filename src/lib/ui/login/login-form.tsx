'use client'

import { useMutation } from '@tanstack/react-query'
import { Mail, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
    signInWithMagicLink as signInWithMagicLinkRequest,
    signInWithOAuth as signInWithOAuthRequest,
} from '@/lib/queries/auth'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { FeedbackMessage, useFeedbackState } from '@/lib/ui/feedback'

type LoginFormProps = {
    next: string
}

export function LoginForm({ next }: LoginFormProps) {
    const supabase = useMemo(() => createBrowserSupabaseClient(), [])
    const [email, setEmail] = useState('')
    const feedback = useFeedbackState()

    const magicLinkMutation = useMutation({
        mutationFn: (nextPath: string) =>
            signInWithMagicLinkRequest(supabase, email, nextPath),
        onSuccess: (successMessage) => {
            feedback.success(successMessage)
        },
        onError: (error) => {
            feedback.error(
                error instanceof Error ? error.message : 'Login failed',
            )
        },
    })

    const oauthMutation = useMutation({
        mutationFn: (provider: 'google' | 'github') =>
            signInWithOAuthRequest(supabase, provider, next),
        onError: (error) => {
            feedback.error(
                error instanceof Error ? error.message : 'Login failed',
            )
        },
    })

    const isSubmitting = magicLinkMutation.isPending || oauthMutation.isPending

    async function signInWithMagicLink(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()
        feedback.clear()

        await magicLinkMutation.mutateAsync(next)
    }

    async function signInWithOAuth(provider: 'google' | 'github') {
        feedback.clear()
        await oauthMutation.mutateAsync(provider)
    }

    return (
        <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white/95 p-8 shadow-xl shadow-emerald-950/5 backdrop-blur-sm sm:p-10">
            <div className="space-y-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                    Welcome back
                </h1>
                <p className="text-sm leading-relaxed text-zinc-500">
                    Sign in to save reflections, bookmark verses, and continue
                    your journey with the Quran.
                </p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={signInWithMagicLink}>
                <label className="block space-y-2">
                    <span className="text-sm font-medium text-zinc-700">
                        Email address
                    </span>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pr-4 pl-11 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>
                </label>

                <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            Sending sign-in link...
                        </>
                    ) : (
                        'Send sign-in link'
                    )}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-zinc-400">
                        or continue with
                    </span>
                </div>
            </div>

            <button
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={() => signInWithOAuth('google')}
                disabled={isSubmitting}
            >
                <svg className="size-4" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Sign in with Google
            </button>

            <FeedbackMessage feedback={feedback.value} className="mt-6" />

            <p className="mt-8 text-center text-xs leading-relaxed text-zinc-400">
                We&apos;ll send a magic link to your email.
                <br />
                No password needed.
            </p>
        </div>
    )
}
