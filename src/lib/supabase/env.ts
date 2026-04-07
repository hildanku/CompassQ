type SupabaseEnv = {
    url: string
    publishableKey: string
}

function readSupabaseEnv(): SupabaseEnv | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !publishableKey) {
        return null
    }

    return {
        url,
        publishableKey,
    }
}

export function hasSupabaseEnv() {
    return readSupabaseEnv() !== null
}

export function getSupabaseEnv() {
    const env = readSupabaseEnv()

    if (!env) {
        throw new Error(
            'Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY).',
        )
    }

    return env
}
