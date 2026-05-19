import { requireUser } from '@/lib/auth'
import { ProfileForm } from '@/lib/ui/profile/profile-form'
import { AppBottomNav } from '@/lib/ui/app-bottom-nav'
import {
    AuthenticatedPageHeader,
    AuthenticatedPageShell,
} from '@/lib/ui/authenticated-page-shell'
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
        <AuthenticatedPageShell>
            <AuthenticatedPageHeader
                eyebrow="Profile"
                title="Keep your CompassQ details up to date."
                description="Update the name and timezone that shape your daily check-ins, so each Quran Moment stays tied to the right context for you."
            />

            <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <div className="rounded-4xl border border-white/70 bg-white/88 p-6 shadow-xl shadow-emerald-950/8 backdrop-blur-xl">
                    <div className="space-y-2">
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                            Identity
                        </p>
                        <h2 className="text-xl font-semibold text-zinc-950">
                            Current identity
                        </h2>
                    </div>
                    <dl className="mt-5 space-y-4 text-sm text-zinc-600">
                        <div className="rounded-3xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(250,250,249,0.94))] p-4">
                            <dt className="font-medium text-zinc-900">
                                User ID
                            </dt>
                            <dd className="mt-1 break-all">{user.id}</dd>
                        </div>
                        <div className="rounded-3xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(250,250,249,0.94))] p-4">
                            <dt className="font-medium text-zinc-900">
                                Email
                            </dt>
                            <dd className="mt-1">
                                {user.email ?? 'No email available'}
                            </dd>
                        </div>
                        <div className="rounded-3xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(250,250,249,0.94))] p-4">
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

                <div className="rounded-4xl border border-white/70 bg-white/88 p-6 shadow-xl shadow-emerald-950/8 backdrop-blur-xl">
                    <div className="mb-5 space-y-2">
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                            Settings
                        </p>
                        <h2 className="text-xl font-semibold text-zinc-950">
                            Profile settings
                        </h2>
                        <p className="text-sm leading-6 text-zinc-600">
                            Set the display name and timezone CompassQ uses when
                            saving your profile and daily check-in rhythm.
                        </p>
                    </div>

                    <ProfileForm
                        initialProfile={{
                            displayName: profile?.display_name ?? null,
                            timezone: profile?.timezone ?? 'UTC',
                        }}
                    />

                    <div className="mt-6 border-t border-emerald-100 pt-5">
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

            <AppBottomNav />
        </AuthenticatedPageShell>
    )
}
