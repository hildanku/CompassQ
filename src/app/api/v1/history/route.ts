import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import {
    errorFromStatus,
    getRequestId,
    parseSearchParams,
} from '@/lib/api-route'
import { historyQuerySchema } from '@/lib/contracts'

type SessionRow = {
    id: string
    ayah_key: string
    completed: boolean
    created_at: string
    check_ins: Array<{
        category: string
    }>
}

type ReflectionRow = {
    session_id: string
    content: string
    created_at: string
}

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = parseSearchParams(request, historyQuerySchema, requestId)

    if ('response' in parsed) {
        return parsed.response
    }

    const { data: sessions, error: sessionsError } = await auth.supabase
        .from('sessions')
        .select('id, ayah_key, completed, created_at, check_ins(category)')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit)

    if (sessionsError) {
        return errorFromStatus(500, 'Failed to load history', requestId)
    }

    const typedSessions = (sessions ?? []) as unknown as SessionRow[]
    const sessionIds = typedSessions.map((session) => session.id)

    const latestReflectionBySession = new Map<string, ReflectionRow>()
    const reflectionCountBySession = new Map<string, number>()

    if (sessionIds.length > 0) {
        const { data: reflections, error: reflectionsError } =
            await auth.supabase
                .from('reflections')
                .select('session_id, content, created_at')
                .eq('user_id', auth.user.id)
                .in('session_id', sessionIds)
                .order('created_at', { ascending: false })

        if (reflectionsError) {
            return errorFromStatus(500, 'Failed to load reflections', requestId)
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

    return apiSuccess(
        {
            limit: parsed.data.limit,
            sessions: typedSessions.map((session) => {
                const latestReflection = latestReflectionBySession.get(
                    session.id,
                )

                return {
                    sessionId: session.id,
                    ayahKey: session.ayah_key,
                    category: session.check_ins[0]?.category ?? null,
                    completed: session.completed,
                    createdAt: session.created_at,
                    reflectionCount:
                        reflectionCountBySession.get(session.id) ?? 0,
                    latestReflection: latestReflection
                        ? {
                              content: latestReflection.content,
                              createdAt: latestReflection.created_at,
                          }
                        : null,
                }
            }),
        },
        'History loaded',
        { requestId },
    )
}
