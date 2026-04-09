import Link from 'next/link'

import { requireUser } from '@/lib/auth'

import { ProfileForm } from './profile-form'

export default async function ProtectedPage() {
    const { supabase, user } = await requireUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, timezone, created_at')
        .eq('id', user.id)
        .single()

    return (
        <main className="min-h-screen bg-zinc-50 px-6 py-12">
            <div className="mx-auto flex max-w-4xl flex-col gap-8">
                <header className="rounded-3xl bg-emerald-950 px-8 py-10 text-white shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
                        Protected route
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                        Session handling is active.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/85">
                        This page only renders for authenticated users. If no
                        session is present, Next.js returns a 401 via the auth
                        guard.
                    </p>
                </header>

                <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5">
                        <h2 className="text-xl font-semibold text-zinc-950">
                            Current identity
                        </h2>
                        <dl className="mt-5 space-y-4 text-sm text-zinc-600">
                            <div>
                                <dt className="font-medium text-zinc-900">
                                    User ID
                                </dt>
                                <dd className="mt-1 break-all">{user.id}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-zinc-900">
                                    Email
                                </dt>
                                <dd className="mt-1">
                                    {user.email ?? 'No email available'}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-zinc-900">
                                    Profile created
                                </dt>
                                <dd className="mt-1">
                                    {profile?.created_at
                                        ? new Date(
                                              profile.created_at,
                                          ).toLocaleString()
                                        : 'Profile row missing'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5">
                        <div className="mb-5 space-y-2">
                            <h2 className="text-xl font-semibold text-zinc-950">
                                Profile foundation
                            </h2>
                            <p className="text-sm leading-6 text-zinc-600">
                                `profiles` is created automatically on first
                                login, then you can keep `display_name` and
                                `timezone` up to date here.
                            </p>
                        </div>

                        <ProfileForm
                            initialProfile={{
                                displayName: profile?.display_name ?? null,
                                timezone: profile?.timezone ?? 'UTC',
                            }}
                        />
                    </div>
                </section>

                <div className="flex flex-wrap gap-3 text-sm">
                    <Link
                        href="/"
                        className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-100"
                    >
                        Back home
                    </Link>
                </div>
            </div>
        </main>
    )
}
