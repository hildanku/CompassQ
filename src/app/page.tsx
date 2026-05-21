import Link from 'next/link'
import {
    Heart,
    BookOpen,
    Bookmark,
    Sparkles,
    ArrowRight,
    Play,
    Star,
} from 'lucide-react'

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
        <main className="relative min-h-screen overflow-hidden bg-[#021a0d]">
            {/* Animated background layers */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,95,70,0.2),transparent_50%)]" />
                <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
                {/* Geometric pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzAgMEwzMCA2ME0wIDMwTDYwIDMwTTAgMEw2MCA2ME02MCAwTDAgNjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBmaWxsPSJub25lIi8+PC9zdmc+')]" />
            </div>

            {/* Hero */}
            <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
                <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-5 py-2 text-sm font-medium text-emerald-300 backdrop-blur-sm">
                    <Sparkles className="size-4" />
                    CompassQ
                </div>

                <h1 className="max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    Find a Quran moment
                    <span className="mt-2 block bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                        that speaks to your heart.
                    </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-emerald-100/60 sm:text-lg">
                    A simple daily ritual: check in with how you feel, receive a
                    curated verse, reflect, and build a meaningful connection
                    with the Quran.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                    <Link
                        href={isConfigured ? (user ? '/' : '/login') : '/login'}
                        className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30"
                    >
                        {isConfigured
                            ? user
                                ? 'Go to home'
                                : 'Start your journey'
                            : 'View setup guide'}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                        href={isConfigured && user ? '/profile' : '/login'}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10"
                    >
                        {isConfigured && user
                            ? 'Open profile'
                            : 'See how it works'}
                    </Link>
                </div>

                {!isConfigured && (
                    <p className="mt-8 max-w-xl rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 text-sm leading-relaxed text-amber-200/80 backdrop-blur-sm">
                        Supabase env variables are missing. Set{' '}
                        <code className="rounded bg-amber-400/10 px-1.5 py-0.5 font-mono text-xs text-amber-100">
                            NEXT_PUBLIC_SUPABASE_URL
                        </code>{' '}
                        and{' '}
                        <code className="rounded bg-amber-400/10 px-1.5 py-0.5 font-mono text-xs text-amber-100">
                            NEXT_PUBLIC_SUPABASE_ANON_KEY
                        </code>{' '}
                        first.
                    </p>
                )}
            </section>

            {/* Trust / Social Proof */}
            <section className="relative mx-auto max-w-5xl px-6 pb-16 sm:pb-20">
                <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 backdrop-blur-sm sm:gap-10">
                    <div className="flex items-center gap-2 text-sm text-emerald-100/50">
                        <BookOpen className="size-4 text-emerald-400/70" />
                        <span>
                            <strong className="text-emerald-100/80">
                                6,236
                            </strong>{' '}
                            ayat available
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-100/50">
                        <Star className="size-4 text-emerald-400/70" />
                        <span>
                            Curated by{' '}
                            <strong className="text-emerald-100/80">
                                Quran Foundation
                            </strong>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-100/50">
                        <Heart className="size-4 text-emerald-400/70" />
                        <span>
                            Personalized to{' '}
                            <strong className="text-emerald-100/80">
                                your feelings
                            </strong>
                        </span>
                    </div>
                </div>
            </section>

            {/* Steps */}
            <section className="relative mx-auto max-w-5xl px-6 pb-20 sm:pb-28">
                <div className="mb-10 text-center sm:mb-14">
                    <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                        Three simple steps
                    </h2>
                    <p className="mt-3 text-sm text-emerald-100/50 sm:text-base">
                        A gentle daily practice that meets you where you are.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                    {[
                        {
                            step: '01',
                            label: 'Check-in',
                            desc: 'Begin with a simple question about how you are showing up today. No judgment, just honesty.',
                            icon: Heart,
                            gradient: 'from-rose-400/20 to-emerald-400/20',
                        },
                        {
                            step: '02',
                            label: 'Quran moment',
                            desc: 'Receive a curated verse matched to your state — with Arabic text, translation, tafsir, and audio.',
                            icon: BookOpen,
                            gradient: 'from-emerald-400/20 to-teal-400/20',
                        },
                        {
                            step: '03',
                            label: 'Save & return',
                            desc: 'Bookmark verses, organize collections, and build a streak that keeps your connection alive.',
                            icon: Bookmark,
                            gradient: 'from-teal-400/20 to-cyan-400/20',
                        },
                    ].map(({ step, label, desc, icon: Icon, gradient }) => (
                        <div
                            key={step}
                            className="group relative rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition-all hover:border-emerald-400/20 hover:bg-white/[0.05] sm:p-8"
                        >
                            <div
                                className={`mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient}`}
                            >
                                <Icon className="size-5 text-emerald-300" />
                            </div>
                            <p className="mb-1 text-xs font-semibold tracking-wider text-emerald-400/80 uppercase">
                                Step {step}
                            </p>
                            <h3 className="mb-2 text-lg font-semibold text-white">
                                {label}
                            </h3>
                            <p className="text-sm leading-relaxed text-emerald-100/50">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Ayah Preview */}
            <section className="relative mx-auto max-w-5xl px-6 pb-20 sm:pb-28">
                <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 backdrop-blur-sm sm:p-12">
                    <div className="mb-6 flex items-center gap-2 text-xs font-medium tracking-wider text-emerald-400/70 uppercase">
                        <Play className="size-3.5" />
                        Preview experience
                    </div>

                    {/* Arabic text */}
                    <p
                        className="mb-6 text-right font-serif text-3xl leading-loose text-white/90 sm:text-4xl"
                        dir="rtl"
                        lang="ar"
                    >
                        أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ
                    </p>

                    {/* Translation */}
                    <p className="mb-4 max-w-lg text-base leading-relaxed text-emerald-100/70 italic sm:text-lg">
                        &ldquo;Verily, in the remembrance of Allah do hearts
                        find rest.&rdquo;
                    </p>

                    {/* Reference */}
                    <div className="flex items-center gap-3">
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs font-medium text-emerald-300">
                            Ar-Ra&apos;d 13:28
                        </span>
                        <span className="text-xs text-emerald-100/40">
                            Surah The Thunder
                        </span>
                    </div>

                    {/* Decorative corner */}
                    <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_70%)]" />
                </div>
            </section>

            {/* Footer CTA */}
            <section className="relative mx-auto max-w-5xl px-6 pb-20 sm:pb-28">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                        Ready to begin?
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-emerald-100/50 sm:text-base">
                        It only takes a moment. Check in with yourself, and let
                        the Quran meet you where you are today.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link
                            href={
                                isConfigured
                                    ? user
                                        ? '/'
                                        : '/login'
                                    : '/login'
                            }
                            className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30"
                        >
                            {isConfigured
                                ? user
                                    ? 'Go to home'
                                    : 'Sign in to CompassQ'
                                : 'Get started'}
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative border-t border-white/5 py-8">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="flex items-center gap-2 text-sm text-emerald-100/40">
                            <Sparkles className="size-3.5" />
                            CompassQ
                        </div>
                        <p className="text-xs text-emerald-100/30">
                            Team Miaww Miaww Startup, Aamiin
                        </p>
                        <p className="text-xs text-emerald-100/30">
                            Built with the Quran Foundation API
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    )
}
