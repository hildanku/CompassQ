import { redirect } from 'next/navigation'

import { getServerAuth } from '@/lib/auth'

import { LoginForm } from './login-form'

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

    if (isConfigured && user) {
        redirect(next && next.startsWith('/') ? next : '/')
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ecfdf5,_#f8fafc_55%,_#ffffff)] px-6 py-16">
            <div className="w-full max-w-5xl gap-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="mb-10 space-y-6 lg:mb-0">
                    <div className="inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-700 backdrop-blur">
                        CompassQ
                    </div>
                    <div className="space-y-4">
                        <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
                            Kembali ke Quran dari keadaan yang sedang kamu bawa
                            hari ini.
                        </h1>
                        <p className="max-w-xl text-lg leading-8 text-zinc-600">
                            CompassQ membantu kamu memulai dari rasa yang sedang
                            hadir, lalu menemukan ayat yang relevan untuk
                            dibaca, direnungi, dan disimpan untuk kembali lagi
                            nanti.
                        </p>
                    </div>
                    {error ? (
                        <p className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            Proses masuk gagal. Coba ulangi sekali lagi.
                        </p>
                    ) : null}
                </div>

                {isConfigured ? (
                    <LoginForm
                        next={next && next.startsWith('/') ? next : '/'}
                    />
                ) : (
                    <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 shadow-sm shadow-amber-950/5">
                        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                            Konfigurasi Supabase belum lengkap
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-zinc-600">
                            SETUP ENV NYA
                        </p>
                    </div>
                )}
            </div>
        </main>
    )
}
