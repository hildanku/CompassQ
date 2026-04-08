import {
    getServerAuth,
    serviceUnavailableJson,
    unauthorizedJson,
} from '@/lib/auth'

export async function requireApiUser(requestId: string) {
    const { supabase, user, isConfigured } = await getServerAuth()

    if (!isConfigured || !supabase) {
        return { response: serviceUnavailableJson(requestId) }
    }

    if (!user) {
        return { response: unauthorizedJson(requestId) }
    }

    return { supabase, user }
}
