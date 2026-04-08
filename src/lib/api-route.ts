import type { ZodType } from 'zod'
import { ZodError } from 'zod'

import { apiError, createRequestId, type ApiErrorCode } from '@/lib/api'

type ValidationIssue = {
    path: string
    message: string
}

export function getRequestId(request: Request) {
    return request.headers.get('x-request-id') ?? createRequestId()
}

function formatZodError(error: ZodError): ValidationIssue[] {
    return error.issues.map((issue) => ({
        path: issue.path.join('.') || 'root',
        message: issue.message,
    }))
}

export function validationErrorJson(error: ZodError, requestId: string) {
    return apiError('Invalid request payload', {
        status: 400,
        code: 'BAD_REQUEST',
        details: formatZodError(error),
        requestId,
    })
}

export async function parseJsonBody<T>(
    request: Request,
    schema: ZodType<T>,
    requestId: string,
) {
    let body: unknown

    try {
        body = await request.json()
    } catch {
        return {
            response: apiError('Invalid JSON body', {
                status: 400,
                code: 'BAD_REQUEST',
                requestId,
            }),
        }
    }

    const result = schema.safeParse(body)

    if (!result.success) {
        return {
            response: validationErrorJson(result.error, requestId),
        }
    }

    return { data: result.data }
}

export function parseSearchParams<T>(
    request: Request,
    schema: ZodType<T>,
    requestId: string,
) {
    const url = new URL(request.url)
    const result = schema.safeParse(Object.fromEntries(url.searchParams))

    if (!result.success) {
        return {
            response: validationErrorJson(result.error, requestId),
        }
    }

    return { data: result.data }
}

export function errorFromStatus(
    status: number,
    message: string,
    requestId: string,
    details?: unknown,
) {
    const statusCodeMap: Record<number, ApiErrorCode> = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        429: 'RATE_LIMITED',
        502: 'UPSTREAM_UNAVAILABLE',
        503: 'SERVICE_UNAVAILABLE',
    }

    return apiError(message, {
        status,
        code: statusCodeMap[status] ?? 'INTERNAL_ERROR',
        details,
        requestId,
    })
}

export function getDatabaseErrorCode(error: unknown) {
    if (!error || typeof error !== 'object') {
        return null
    }

    const code = Reflect.get(error, 'code')

    return typeof code === 'string' ? code : null
}
