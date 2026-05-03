import Link from 'next/link'

import { getServerAuth } from '@/lib/auth'
import { CheckInHome } from '@/lib/ui/home/check-in-home'

export default async function Home() {
    const { supabase, user, isConfigured } = await getServerAuth()

    if (isConfigured && user && supabase) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single()

        return <CheckInHome displayName={profile?.display_name ?? null} />
    }

    return (
        <main className="min-h-screen bg-[#052e16]">
            {/* Hero */}
            <section className="mx-auto max-w-4xl px-6 pt-14 pb-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    CompassQ
                </div>

                <h1 className="max-w-2xl text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl">
                    Find a Quran moment that matches what you are carrying
                    today.
                </h1>

                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-emerald-100/70">
                    Start with a simple check-in, continue to a curated verse,
                    add a short reflection, then save what you want to revisit.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href={isConfigured ? (user ? '/' : '/login') : '/login'}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-emerald-950 transition hover:bg-emerald-50"
                    >
                        {isConfigured
                            ? user
                                ? 'Go to home'
                                : 'Sign in to CompassQ'
                            : 'View setup guide'}
                    </Link>
                    <Link
                        href={isConfigured && user ? '/profile' : '/login'}
                        className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                        {isConfigured && user
                            ? 'Open profile'
                            : 'View product flow'}
                    </Link>
                </div>

                {!isConfigured && (
                    <p className="mt-6 max-w-xl rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                        Supabase env variables are missing. Set{' '}
                        <code className="font-mono text-amber-100">
                            NEXT_PUBLIC_SUPABASE_URL
                        </code>{' '}
                        and{' '}
                        <code className="font-mono text-amber-100">
                            NEXT_PUBLIC_SUPABASE_ANON_KEY
                        </code>{' '}
                        first.
                    </p>
                )}
            </section>

            {/* Steps */}
            <section className="mx-auto max-w-4xl px-6 pb-16">
                <div className="grid grid-cols-1 gap-px rounded-2xl border border-white/10 bg-white/10 overflow-hidden sm:grid-cols-3">
                    {[
                        {
                            step: '01',
                            label: 'Check-in',
                            desc: 'Begin with a simple question about how you are showing up today.',
                        },
                        {
                            step: '02',
                            label: 'Quran moment',
                            desc: 'Get curated verses to read, listen to, and reflect on.',
                        },
                        {
                            step: '03',
                            label: 'Save & return',
                            desc: 'Bookmark and revisit so your connection stays strong.',
                        },
                    ].map(({ step, label, desc }) => (
                        <div
                            key={step}
                            className="bg-white/5 px-5 py-6 backdrop-blur-sm"
                        >
                            <p className="mb-2 text-xs font-medium text-emerald-400">
                                {step} — {label}
                            </p>
                            <p className="text-sm leading-relaxed text-emerald-100/60">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    )
}
