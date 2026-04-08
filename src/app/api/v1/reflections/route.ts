import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { errorFromStatus, getRequestId, parseJsonBody } from '@/lib/api-route'
import { createReflectionSchema } from '@/lib/contracts'

export async function POST(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(
        request,
        createReflectionSchema,
        requestId,
    )

    if ('response' in parsed) {
        return parsed.response
    }

    const { data: session, error: sessionError } = await auth.supabase
        .from('sessions')
        .select('id, ayah_key')
        .eq('id', parsed.data.sessionId)
        .eq('user_id', auth.user.id)
        .maybeSingle()

    if (sessionError) {
        return errorFromStatus(500, 'Failed to load session', requestId)
    }

    if (!session) {
        return errorFromStatus(404, 'Session not found', requestId)
    }

    const { data: reflection, error: reflectionError } = await auth.supabase
        .from('reflections')
        .insert({
            user_id: auth.user.id,
            session_id: session.id,
            ayah_key: session.ayah_key,
            content: parsed.data.content,
        })
        .select('id, session_id, ayah_key, created_at')
        .single()

    if (reflectionError) {
        return errorFromStatus(500, 'Failed to save reflection', requestId)
    }

    return apiSuccess(
        {
            reflectionId: reflection.id,
            sessionId: reflection.session_id,
            ayahKey: reflection.ayah_key,
            createdAt: reflection.created_at,
        },
        'Reflection saved',
        { status: 201, requestId },
    )
}
