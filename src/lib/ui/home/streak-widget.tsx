'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchStreak, streakQueryKey } from '@/lib/queries/moments'

export function StreakWidget() {
    const streakQuery = useQuery({
        queryKey: streakQueryKey,
        queryFn: fetchStreak,
    })

    if (streakQuery.isLoading) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                <div className="animate-pulse flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-200" />
                    <div className="space-y-1.5">
                        <div className="h-3 w-20 rounded-full bg-emerald-200" />
                        <div className="h-3 w-28 rounded-full bg-emerald-200" />
                    </div>
                </div>
            </div>
        )
    }

    if (streakQuery.error || !streakQuery.data) {
        return null
    }

    const { current, longest } = streakQuery.data

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                {current}
            </div>
            <div className="space-y-0.5">
                <p className="text-sm font-semibold text-emerald-900">
                    {current} day{current === 1 ? '' : 's'} streak
                </p>
                <p className="text-xs text-emerald-700/70">
                    Longest: {longest} day{longest === 1 ? '' : 's'}
                </p>
            </div>
        </div>
    )
}
