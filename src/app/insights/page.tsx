import { requireUser } from '@/lib/auth'

import { WeeklyInsightsDashboard } from './weekly-insights-dashboard'

function getCurrentWeekStart(timezone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
    const parts = formatter.formatToParts(new Date())
    const year = Number(
        parts.find((part) => part.type === 'year')?.value ?? '0',
    )
    const month = Number(
        parts.find((part) => part.type === 'month')?.value ?? '1',
    )
    const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1')
    const localDate = new Date(Date.UTC(year, month - 1, day))
    const weekday = localDate.getUTCDay()
    const mondayOffset = (weekday + 6) % 7

    localDate.setUTCDate(localDate.getUTCDate() - mondayOffset)

    return localDate.toISOString().slice(0, 10)
}

export default async function InsightsPage() {
    const { supabase, user } = await requireUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single()

    return (
        <WeeklyInsightsDashboard
            initialWeekStart={getCurrentWeekStart(profile?.timezone ?? 'UTC')}
        />
    )
}
