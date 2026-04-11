import type { Metadata } from 'next'
import { Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google'

import { NetworkStatusToast } from '@/app/network-status-toast'
import { QueryProvider } from '@/app/query-provider'

import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: '--font-plus-jakarta-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'CompassQ',
    description: 'Quran reflection app foundation with Supabase auth.',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <QueryProvider>
                    {children}
                    <NetworkStatusToast />
                </QueryProvider>
            </body>
        </html>
    )
}
