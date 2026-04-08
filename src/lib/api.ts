export type ApiErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'UPSTREAM_UNAVAILABLE'
    | 'SERVICE_UNAVAILABLE'
    | 'INTERNAL_ERROR'

export type ApiResponse<T> = {
    requestId: string
    message: string
    data: T | null
    error?: {
        code: ApiErrorCode | string
        details?: unknown
    }
}

type ApiResponseOptions = ResponseInit & {
    requestId?: string
    code?: ApiErrorCode | string
    details?: unknown
}

export function createRequestId() {
    return `req_${crypto.randomUUID().replaceAll('-', '')}`
}

export function apiSuccess<T>(
    data: T,
    message = 'OK',
    init?: ApiResponseOptions,
) {
    const requestId = init?.requestId ?? createRequestId()

    return Response.json(
        {
            requestId,
            message,
            data,
        },
        init,
    )
}

export function apiError(message: string, init?: ApiResponseOptions) {
    const requestId = init?.requestId ?? createRequestId()

    return Response.json(
        {
            requestId,
            message,
            data: null,
            error: {
                code: init?.code ?? 'INTERNAL_ERROR',
                details: init?.details,
            },
        },
        init,
    )
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
