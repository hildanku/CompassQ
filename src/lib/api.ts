export type ApiResponse<T> = {
    message: string
    data: T | null
}

export function apiSuccess<T>(data: T, message = 'OK', init?: ResponseInit) {
    return Response.json({ message, data }, init)
}

export function apiError(message: string, init?: ResponseInit) {
    return Response.json({ message, data: null }, init)
}

export class ApiClientError extends Error {
    status: number
    payload: ApiResponse<unknown> | null

    constructor(
        message: string,
        options: { status: number; payload: ApiResponse<unknown> | null },
    ) {
        super(message)
        this.name = 'ApiClientError'
        this.status = options.status
        this.payload = options.payload
    }
}

export async function apiFetch<T>(
    input: RequestInfo | URL,
    init?: RequestInit,
) {
    const response = await fetch(input, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...init?.headers,
        },
    })

    let payload: ApiResponse<T> | null = null

    try {
        payload = (await response.json()) as ApiResponse<T>
    } catch {
        if (!response.ok) {
            throw new ApiClientError('Request failed', {
                status: response.status,
                payload: null,
            })
        }

        throw new ApiClientError('Invalid JSON response', {
            status: response.status,
            payload: null,
        })
    }

    if (!response.ok) {
        throw new ApiClientError(payload.message, {
            status: response.status,
            payload,
        })
    }

    return payload
}
