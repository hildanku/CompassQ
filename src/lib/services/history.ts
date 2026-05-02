import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'

type SessionRow = {
    id: string
    ayah_key: string
    completed: boolean
    created_at: string
    check_ins: {
        category: string
    } | null
}

type ReflectionRow = {
    session_id: string
    content: string
    created_at: string
}

export async function getHistory(
    { supabase, userId }: ServiceContext,
    limit: number,
) {
    const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, ayah_key, completed, created_at, check_ins(category)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (sessionsError) {
        throw new ServiceError(500, 'Failed to load history')
    }

    const typedSessions = (sessions ?? []) as unknown as SessionRow[]
    const sessionIds = typedSessions.map((session) => session.id)
    const latestReflectionBySession = new Map<string, ReflectionRow>()
    const reflectionCountBySession = new Map<string, number>()

    if (sessionIds.length > 0) {
        const { data: reflections, error: reflectionsError } = await supabase
            .from('reflections')
            .select('session_id, content, created_at')
            .eq('user_id', userId)
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })

        if (reflectionsError) {
            throw new ServiceError(500, 'Failed to load reflections')
        }

        for (const reflection of (reflections ?? []) as ReflectionRow[]) {
            reflectionCountBySession.set(
                reflection.session_id,
                (reflectionCountBySession.get(reflection.session_id) ?? 0) + 1,
            )

            if (!latestReflectionBySession.has(reflection.session_id)) {
                latestReflectionBySession.set(reflection.session_id, reflection)
            }
        }
    }

    return {
        limit,
        sessions: typedSessions.map((session) => {
            const latestReflection = latestReflectionBySession.get(session.id)

            return {
                sessionId: session.id,
                ayahKey: session.ayah_key,
                category: session.check_ins?.category ?? null,
                completed: session.completed,
                createdAt: session.created_at,
                reflectionCount: reflectionCountBySession.get(session.id) ?? 0,
                latestReflection: latestReflection
                    ? {
                          content: latestReflection.content,
                          createdAt: latestReflection.created_at,
                      }
                    : null,
            }
        }),
    }
}
