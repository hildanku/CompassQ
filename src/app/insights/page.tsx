import { requireUser } from '@/lib/auth'
import { WeeklyInsightsDashboard } from '@/lib/ui/insights/weekly-insights-dashboard'
import { getCurrentWeekStartInTimeZone } from '@/lib/utils'

export default async function InsightsPage() {
    const { supabase, user } = await requireUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single()

    return (
        <WeeklyInsightsDashboard
            initialWeekStart={getCurrentWeekStartInTimeZone(
                profile?.timezone ?? 'UTC',
            )}
        />
    )
}
