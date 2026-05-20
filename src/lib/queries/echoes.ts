import { ApiClientError, apiFetch } from '@/lib/api'
import type { EchoVerse } from '@/lib/ui/home/echoes-section'

type EchoesResponse = {
    sessionId: string
    echoes: EchoVerse[]
}

type SaveEchoesResponse = {
    collectionId: string
    collectionName: string
    itemCount: number
}

export function echoesQueryKey(sessionId: string) {
    return ['echoes', sessionId] as const
}

export async function fetchEchoes(sessionId: string) {
    const payload = await apiFetch<EchoesResponse>(
        `/api/v1/sessions/${sessionId}/echoes`,
    )

    if (!payload.data) {
        throw new ApiClientError('Failed to load echoes', {
            status: 500,
            payload,
        })
    }

    return payload.data
}

export async function saveEchoesAsCollection(
    sessionId: string,
    echoAyahKeys: string[],
) {
    const payload = await apiFetch<SaveEchoesResponse>(
        `/api/v1/sessions/${sessionId}/echoes/save`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ echoAyahKeys }),
        },
    )

    if (!payload.data?.collectionId) {
        throw new ApiClientError('Failed to save echoes as collection', {
            status: 500,
            payload,
        })
    }

    return payload.data
}
