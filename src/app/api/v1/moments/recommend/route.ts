import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { getRequestId, parseJsonBody } from '@/lib/api-route'
import { recommendMomentSchema } from '@/lib/contracts'

export async function POST(request: Request) {
    const requestId = getRequestId(request)
    const auth = await requireApiUser(requestId)

    if ('response' in auth) {
        return auth.response
    }

    const parsed = await parseJsonBody(
        request,
        recommendMomentSchema,
        requestId,
    )

    if ('response' in parsed) {
        return parsed.response
    }

    return apiSuccess(
        {
            sessionId: crypto.randomUUID(),
            ayah: {
                ayahKey: '2:286',
                surahNumber: 2,
                ayahNumber: 286,
                arabicText: '',
                translation: '',
                tafsirSnippet: '',
                audioUrl: '',
            },
            checkInId: parsed.data.checkInId,
        },
        'Moment recommendation contract skeleton ready',
        { status: 202, requestId },
    )
}
