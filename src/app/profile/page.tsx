import { requireUser } from '@/lib/auth'
import { ProfileForm } from '@/lib/ui/profile/profile-form'
import { AppBottomNav } from '@/lib/ui/app-bottom-nav'
import { LogoutButton } from '@/lib/ui/logout-button'
import { formatUtcTimestamp } from '@/lib/utils'

export default async function ProfilePage() {
    const { supabase, user } = await requireUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, timezone, created_at')
        .eq('id', user.id)
        .single()

    return (
        <main className="min-h-screen bg-zinc-50 px-6 py-12">
            <div className="mx-auto flex max-w-4xl flex-col gap-8 pb-28">
                <header className="rounded-3xl bg-emerald-950 px-8 py-10 text-white shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
                        Profile
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                        Keep your CompassQ details up to date.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/85">
                        Update the name and timezone that shape your daily
                        check-ins, so each Quran Moment stays tied to the right
                        context for you.
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
                                        ? formatUtcTimestamp(profile.created_at)
                                        : 'Profile row missing'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5">
                        <div className="mb-5 space-y-2">
                            <h2 className="text-xl font-semibold text-zinc-950">
                                Profile settings
                            </h2>
                            <p className="text-sm leading-6 text-zinc-600">
                                Set the display name and timezone CompassQ uses
                                when saving your profile and daily check-in
                                rhythm.
                            </p>
                        </div>

                        <ProfileForm
                            initialProfile={{
                                displayName: profile?.display_name ?? null,
                                timezone: profile?.timezone ?? 'UTC',
                            }}
                        />

                        <div className="mt-6 border-t border-zinc-200 pt-5">
                            <p className="text-sm leading-6 text-zinc-600">
                                Need to leave this device? Sign out from your
                                profile here.
                            </p>
                            <div className="mt-4">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <AppBottomNav />
        </main>
    )
}
