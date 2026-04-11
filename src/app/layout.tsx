import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { NetworkStatusToast } from '@/app/network-status-toast'
import { QueryProvider } from '@/app/query-provider'

import './globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
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
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
