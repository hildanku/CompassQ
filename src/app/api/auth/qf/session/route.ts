import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { clearQfTokenCookies } from '@/lib/qf/oidc'

export async function GET() {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('qf_access_token')?.value
    const expiresAtStr = cookieStore.get('qf_token_expires_at')?.value
    const hasRefreshToken = Boolean(
        cookieStore.get('qf_refresh_token')?.value,
    )

    if (!accessToken) {
        return NextResponse.json({
            connected: false,
            expiresAt: null,
            hasRefreshToken: false,
        })
    }

    const expiresAt = expiresAtStr ? Number(expiresAtStr) : 0
    const isExpired = expiresAt > 0 && expiresAt < Date.now()

    if (isExpired && !hasRefreshToken) {
        clearQfTokenCookies(cookieStore)
        return NextResponse.json({
            connected: false,
            expiresAt: null,
            hasRefreshToken: false,
        })
    }

    return NextResponse.json({
        connected: true,
        expiresAt,
        hasRefreshToken,
    })
}

export async function DELETE() {
    const cookieStore = await cookies()
    clearQfTokenCookies(cookieStore)

    return NextResponse.json({ connected: false })
}
