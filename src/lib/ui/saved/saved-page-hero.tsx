'use client'

import Link from 'next/link'

export function SavedPageHero() {
    return (
        <section className="rounded-4xl bg-emerald-950 px-6 py-8 text-white shadow-sm sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
                        Saved
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Bookmark quickly, then organize deliberately.
                    </h1>
                    <p className="max-w-3xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                        Keep ayah you want to revisit close at hand, then sort
                        them into collections when a pattern starts to form.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm">
                    <Link
                        href="/history"
                        className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                    >
                        History
                    </Link>
                    <Link
                        href="/insights"
                        className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                    >
                        Weekly recap
                    </Link>
                    <Link
                        href="/"
                        className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                    >
                        Back home
                    </Link>
                    <Link
                        href="/profile"
                        className="rounded-full bg-white px-4 py-2 font-medium text-emerald-950 transition hover:bg-emerald-50"
                    >
                        Profile
                    </Link>
                </div>
            </div>
        </section>
    )
}
