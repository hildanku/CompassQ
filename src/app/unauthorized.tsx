import Link from 'next/link'

export default function UnauthorizedPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-white">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
                    401 unauthorized
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                    Sign in required
                </h1>
                <p className="mt-4 text-base leading-7 text-zinc-300">
                    This route is protected by the Supabase session guard.
                    Authenticate first, then retry the request.
                </p>
                <div className="mt-8 flex gap-3">
                    <Link
                        href="/login"
                        className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                    >
                        Go to login
                    </Link>
                    <Link
                        href="/"
                        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        Back home
                    </Link>
                </div>
            </div>
        </main>
    )
}
