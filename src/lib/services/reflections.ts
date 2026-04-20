import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'

export async function createReflection(
    { supabase, userId }: ServiceContext,
    sessionId: string,
    content: string,
) {
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, ayah_key')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()

    if (sessionError) {
        throw new ServiceError(500, 'Failed to load session')
    }

    if (!session) {
        throw new ServiceError(404, 'Session not found')
    }

    const { data: reflection, error: reflectionError } = await supabase
        .from('reflections')
        .insert({
            user_id: userId,
            session_id: session.id,
            ayah_key: session.ayah_key,
            content,
        })
        .select('id, session_id, ayah_key, created_at')
        .single()

    if (reflectionError) {
        throw new ServiceError(500, 'Failed to save reflection')
    }

    return {
        reflectionId: reflection.id,
        sessionId: reflection.session_id,
        ayahKey: reflection.ayah_key,
        createdAt: reflection.created_at,
    }
}
