import { type ReactNode } from 'react'

type AuthenticatedPageShellProps = {
    children: ReactNode
    width?: 'default' | 'wide'
}

type AuthenticatedPageHeaderProps = {
    eyebrow: string
    title: string
    description: string
    actions?: ReactNode
}

export function AuthenticatedPageShell({
    children,
    width = 'default',
}: AuthenticatedPageShellProps) {
    const maxWidthClass = width === 'wide' ? 'max-w-6xl' : 'max-w-5xl'

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,83,45,0.18),_rgba(6,78,59,0.12)_20%,_rgba(240,253,250,0.9)_45%,_#fafaf9_72%,_#f5f5f4_100%)] px-4 py-8 text-zinc-950 sm:px-6 sm:py-10">
            <div
                className={`mx-auto flex flex-col gap-8 pb-28 ${maxWidthClass}`}
            >
                {children}
            </div>
        </main>
    )
}

export function AuthenticatedPageHeader({
    eyebrow,
    title,
    description,
    actions,
}: AuthenticatedPageHeaderProps) {
    return (
        <section className="relative overflow-hidden rounded-4xl border border-white/60 bg-white/72 p-6 shadow-xl shadow-emerald-950/10 backdrop-blur-xl sm:p-8">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_70%)]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl space-y-3">
                    <p className="inline-flex rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        {eyebrow}
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                        {title}
                    </h1>
                    <p className="text-sm leading-7 text-zinc-600 sm:text-base">
                        {description}
                    </p>
                </div>

                {actions ? (
                    <div className="flex flex-wrap gap-3 text-sm">{actions}</div>
                ) : null}
            </div>
        </section>
    )
}
