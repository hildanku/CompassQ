import Link from 'next/link'

import { getServerAuth } from '@/lib/auth'

import { CheckInHome } from './check-in-home'

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
        <main className="min-h-screen bg-[linear-gradient(160deg,#022c22,#052e16_45%,#f8fafc_45%,#ffffff)] px-6 py-16 text-zinc-950">
            <div className="mx-auto flex max-w-6xl flex-col gap-14 lg:flex-row lg:items-end lg:justify-between">
                <section className="max-w-3xl space-y-8 text-white">
                    <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100">
                        CompassQ
                    </div>
                    <div className="space-y-5">
                        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
                            Find a Quran Moment that matches what you are
                            carrying today.
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-emerald-50/80">
                            Start with a simple check-in, continue to a curated
                            verse, add a short reflection, then save what you
                            want to revisit. CompassQ is designed to help you
                            build a closer and more consistent connection with
                            the Quran.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={
                                isConfigured
                                    ? user
                                        ? '/'
                                        : '/login'
                                    : '/login'
                            }
                            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
                        >
                            {isConfigured
                                ? user
                                    ? 'Go to home'
                                    : 'Sign in to CompassQ'
                                : 'View setup guide'}
                        </Link>
                        <Link
                            href={
                                isConfigured && user ? '/protected' : '/login'
                            }
                            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            {isConfigured && user
                                ? 'Open profile'
                                : 'View product flow'}
                        </Link>
                    </div>
                    {!isConfigured ? (
                        <p className="max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-200/10 px-4 py-3 text-sm text-amber-100">
                            Supabase env variables are missing. Set
                            `NEXT_PUBLIC_SUPABASE_URL` and
                            `NEXT_PUBLIC_SUPABASE_ANON_KEY` first so auth can
                            be used.
                        </p>
                    ) : null}
                </section>

                <section className="grid gap-4 rounded-4xl bg-white p-6 shadow-xl shadow-emerald-950/10 sm:grid-cols-3 lg:max-w-2xl">
                    <article className="rounded-3xl bg-emerald-50 p-5">
                        <p className="text-sm font-medium text-emerald-700">
                            Check-in
                        </p>
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                            Begin with a simple question about how you are
                            showing up today.
                        </p>
                    </article>
                    <article className="rounded-3xl bg-zinc-50 p-5">
                        <p className="text-sm font-medium text-zinc-900">
                            Quran Moment
                        </p>
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                            Get curated verses to read, listen to, and reflect
                            on.
                        </p>
                    </article>
                    <article className="rounded-3xl bg-amber-50 p-5">
                        <p className="text-sm font-medium text-amber-800">
                            Save and return
                        </p>
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                            Bookmark, collect, and revisit so your connection
                            stays strong.
                        </p>
                    </article>
                </section>
            </div>
        </main>
    )
}
