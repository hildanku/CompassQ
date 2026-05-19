'use client'

import {
    BarChart3,
    History,
    Home,
    type LucideIcon,
    UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
    href: string
    label: string
    icon: LucideIcon
    isActive: (pathname: string) => boolean
}

const navItems: NavItem[] = [
    {
        href: '/',
        label: 'Home',
        icon: Home,
        isActive: (pathname) => pathname === '/',
    },
    {
        href: '/history',
        label: 'History',
        icon: History,
        isActive: (pathname) => pathname.startsWith('/history'),
    },
    {
        href: '/insights',
        label: 'Insights',
        icon: BarChart3,
        isActive: (pathname) => pathname.startsWith('/insights'),
    },
    {
        href: '/profile',
        label: 'Profile',
        icon: UserRound,
        isActive: (pathname) => pathname.startsWith('/profile'),
    },
]

export function AppBottomNav() {
    const pathname = usePathname()

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
            <nav
                aria-label="Primary"
                data-tour="bottom-nav"
                className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-[1.75rem] border border-white/70 bg-white/88 p-2 shadow-2xl shadow-zinc-950/15 backdrop-blur-xl"
            >
                {navItems.map((item) => {
                    const isActive = item.isActive(pathname)
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2.5 text-center text-xs font-medium transition ${
                                isActive
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                            }`}
                        >
                            <span
                                className={`flex size-9 items-center justify-center rounded-full transition ${
                                    isActive
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-transparent text-current'
                                }`}
                            >
                                <Icon size={18} strokeWidth={2.2} />
                            </span>
                            <span className="truncate">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
