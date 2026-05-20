import { redirect } from 'next/navigation'
import { BookOpen, Sparkles, Heart } from 'lucide-react'

import { getServerAuth } from '@/lib/auth'
import { getSafeRedirect } from '@/lib/utils'
import { LoginForm } from '@/lib/ui/login/login-form'

type LoginPageProps = {
    searchParams: Promise<{
        next?: string
        error?: string
    }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const [{ next, error }, { user, isConfigured }] = await Promise.all([
        searchParams,
        getServerAuth(),
    ])
    const safeRedirect = getSafeRedirect(next)

    if (isConfigured && user) {
        redirect(safeRedirect)
    }

    return (
        <main className="relative flex min-h-screen overflow-hidden">
            {/* Left panel - branding */}
            <div className="relative hidden flex-1 items-center justify-center bg-[#021a0d] lg:flex">
                {/* Background effects */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_60%)]" />
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzAgMEwzMCA2ME0wIDMwTDYwIDMwTTAgMEw2MCA2ME02MCAwTDAgNjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBmaWxsPSJub25lIi8+PC9zdmc+')]" />
                </div>

                <div className="relative z-10 max-w-md px-12">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm font-medium text-emerald-300">
                        <Sparkles className="size-3.5" />
                        CompassQ
                    </div>

                    <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
                        Return to the Quran from what you are carrying today.
                    </h2>

                    <p className="mt-4 text-base leading-relaxed text-emerald-100/50">
                        A simple daily ritual that meets you where you are.
                    </p>

                    {/* Feature highlights */}
                    <div className="mt-10 space-y-5">
                        {[
                            {
                                icon: Heart,
                                title: 'Emotional check-in',
                                desc: 'Start from how you feel right now',
                            },
                            {
                                icon: BookOpen,
                                title: 'Curated verses',
                                desc: 'Receive ayat matched to your state',
                            },
                            {
                                icon: Sparkles,
                                title: 'Personal reflections',
                                desc: 'Build a meaningful connection over time',
                            },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div
                                key={title}
                                className="flex items-start gap-4"
                            >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                                    <Icon className="size-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white/90">
                                        {title}
                                    </p>
                                    <p className="text-sm text-emerald-100/40">
                                        {desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_#ecfdf5,_#f8fafc_55%,_#ffffff)] px-6 py-16">
                <div className="w-full max-w-md">
                    {/* Mobile-only branding */}
                    <div className="mb-8 lg:hidden">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-700">
                            <Sparkles className="size-3.5" />
                            CompassQ
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                            Return to the Quran from what you are carrying
                            today.
                        </h1>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                            Sign in to start your daily reflection practice.
                        </p>
                    </div>

                    {error ? (
                        <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            Sign-in failed. Please try again.
                        </p>
                    ) : null}

                    {isConfigured ? (
                        <LoginForm next={safeRedirect} />
                    ) : (
                        <div className="w-full rounded-3xl border border-amber-200 bg-white p-8 shadow-sm shadow-amber-950/5">
                            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                                Supabase configuration is incomplete
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-zinc-600">
                                Configure your environment variables first.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
