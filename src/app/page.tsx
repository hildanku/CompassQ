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
        <main className="min-h-screen bg-[linear-gradient(160deg,_#022c22,_#052e16_45%,_#f8fafc_45%,_#ffffff)] px-6 py-16 text-zinc-950">
            <div className="mx-auto flex max-w-6xl flex-col gap-14 lg:flex-row lg:items-end lg:justify-between">
                <section className="max-w-3xl space-y-8 text-white">
                    <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100">
                        CompassQ
                    </div>
                    <div className="space-y-5">
                        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
                            Temukan Quran Moment yang relevan dengan keadaanmu
                            hari ini.
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-emerald-50/80">
                            Mulai dari check-in sederhana, lanjut ke ayat
                            pilihan, refleksi singkat, lalu simpan yang ingin
                            kamu datangi lagi. CompassQ dirancang untuk membantu
                            hubungan yang lebih dekat dan lebih konsisten dengan
                            Quran.
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
                                    : 'Masuk ke CompassQ'
                                : 'Lihat panduan setup'}
                        </Link>
                        <Link
                            href={
                                isConfigured && user ? '/protected' : '/login'
                            }
                            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            {isConfigured && user
                                ? 'Buka profil'
                                : 'Lihat alur produk'}
                        </Link>
                    </div>
                    {!isConfigured ? (
                        <p className="max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-200/10 px-4 py-3 text-sm text-amber-100">
                            Supabase env belum diisi. Set
                            `NEXT_PUBLIC_SUPABASE_URL` dan
                            `NEXT_PUBLIC_SUPABASE_ANON_KEY` dulu supaya auth
                            bisa dipakai.
                        </p>
                    ) : null}
                </section>

                <section className="grid gap-4 rounded-[2rem] bg-white p-6 shadow-xl shadow-emerald-950/10 sm:grid-cols-3 lg:max-w-2xl">
                    <article className="rounded-3xl bg-emerald-50 p-5">
                        <p className="text-sm font-medium text-emerald-700">
                            Check-in
                        </p>
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                            Mulai dari pertanyaan sederhana tentang bagaimana
                            kamu hadir hari ini.
                        </p>
                    </article>
                    <article className="rounded-3xl bg-zinc-50 p-5">
                        <p className="text-sm font-medium text-zinc-900">
                            Quran Moment
                        </p>
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                            Dapatkan ayat yang dikurasi untuk dibaca, didengar,
                            dan direnungi.
                        </p>
                    </article>
                    <article className="rounded-3xl bg-amber-50 p-5">
                        <p className="text-sm font-medium text-amber-800">
                            Simpan dan kembali
                        </p>
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                            Bookmark, koleksi, dan jejak kembali agar hubungan
                            itu terus terjaga.
                        </p>
                    </article>
                </section>
            </div>
        </main>
    )
}
