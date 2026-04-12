import type { SupabaseClient } from '@supabase/supabase-js'

import { apiSuccess } from '@/lib/api'
import { requireApiUser } from '@/lib/api-auth'
import { errorFromStatus, getRequestId, parseJsonBody } from '@/lib/api-route'
import { recommendMomentSchema } from '@/lib/contracts'
import {
    fetchQfAyahByKey,
    getCachedAyahPayload,
    getQfContentConfig,
} from '@/lib/qf-content'

type CheckInRow = {
    id: string
    category:
        | 'anxiety'
        | 'gratitude'
        | 'patience'
        | 'guidance'
        | 'hope'
        | 'discipline'
        | 'feeling_distant'
        | 'need_comfort'
}

type CandidateRow = {
    ayah_key: string
    priority: number
}

type RouteSupabaseClient = SupabaseClient

type CachedReferenceRow = {
    ayah_key: string
    surah_number: number
    ayah_number: number
    arabic_text: string | null
    translation_text: string | null
    tafsir_snippet: string | null
    audio_url: string | null
}

type SessionRow = {
    id: string
    ayah_key: string
}

async function loadCandidates(
    supabase: RouteSupabaseClient,
    category: CheckInRow['category'],
) {
    const { data, error } = await supabase
        .from('recommendation_catalog')
        .select('ayah_key, priority')
        .eq('category', category)
        .eq('is_active', true)
        .order('priority', { ascending: true })

    if (error) {
        throw new Error('Failed to load recommendation catalog')
    }

    if (data.length > 0) {
        return data as CandidateRow[]
    }

    const { data: fallbackData, error: fallbackError } = await supabase
        .from('recommendation_catalog')
        .select('ayah_key, priority')
        .eq('category', 'guidance')
        .eq('is_active', true)
        .order('priority', { ascending: true })

    if (fallbackError) {
        throw new Error('Failed to load fallback recommendation catalog')
    }

    return fallbackData as CandidateRow[]
}

async function loadLastSessionAyahKey(
    supabase: RouteSupabaseClient,
    userId: string,
) {
    const { data, error } = await supabase
        .from('sessions')
        .select('ayah_key')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error('Failed to load last session')
    }

    return data?.ayah_key ?? null
}

function reorderCandidates(
    candidates: CandidateRow[],
    lastAyahKey: string | null,
) {
    if (!lastAyahKey || candidates.length <= 1) {
        return candidates
    }

    const filtered = candidates.filter(
        (candidate) => candidate.ayah_key !== lastAyahKey,
    )

    return filtered.length > 0
        ? [
              ...filtered,
              ...candidates.filter(
                  (candidate) => candidate.ayah_key === lastAyahKey,
              ),
          ]
        : candidates
}

async function loadCachedReference(
    supabase: RouteSupabaseClient,
    ayahKey: string,
) {
    const { data, error } = await supabase
        .from('quran_references')
        .select(
            'ayah_key, surah_number, ayah_number, arabic_text, translation_text, tafsir_snippet, audio_url',
        )
        .eq('ayah_key', ayahKey)
        .maybeSingle()

    if (error) {
        throw new Error('Failed to load cached ayah reference')
    }

    return data as CachedReferenceRow | null
}

async function persistAyahReference(
    supabase: RouteSupabaseClient,
    ayah: Awaited<ReturnType<typeof fetchQfAyahByKey>>,
) {
    const { error } = await supabase.from('quran_references').upsert(
        {
            source: 'qf',
            surah_number: ayah.surahNumber,
            ayah_number: ayah.ayahNumber,
            ayah_key: ayah.ayahKey,
            arabic_text: ayah.arabicText,
            translation_text: ayah.translation,
            tafsir_snippet: ayah.tafsirSnippet || null,
            audio_url: ayah.audioUrl || null,
        },
        {
            onConflict: 'ayah_key',
            ignoreDuplicates: false,
        },
    )

    if (error) {
        throw new Error('Failed to cache ayah reference')
    }
}

async function resolveAyahPayload(
    supabase: RouteSupabaseClient,
    ayahKey: string,
) {
    const cachedReference = await loadCachedReference(supabase, ayahKey)
    const cachedPayload = getCachedAyahPayload(cachedReference)

    if (cachedPayload) {
        return cachedPayload
    }

    const fetchedAyah = await fetchQfAyahByKey(ayahKey)
    await persistAyahReference(supabase, fetchedAyah)

    return fetchedAyah
}

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

    try {
        getQfContentConfig()
    } catch {
        return errorFromStatus(
            503,
            'Quran Foundation content API is not configured',
            requestId,
        )
    }

    const { data: checkIn, error: checkInError } = await auth.supabase
        .from('check_ins')
        .select('id, category')
        .eq('id', parsed.data.checkInId)
        .eq('user_id', auth.user.id)
        .maybeSingle()

    if (checkInError) {
        return errorFromStatus(500, 'Failed to load check-in', requestId)
    }

    if (!checkIn) {
        return errorFromStatus(404, 'Check-in not found', requestId)
    }

    const { data: existingSession, error: existingSessionError } =
        await auth.supabase
            .from('sessions')
            .select('id, ayah_key')
            .eq('user_id', auth.user.id)
            .eq('check_in_id', checkIn.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

    if (existingSessionError) {
        return errorFromStatus(
            500,
            'Failed to load existing session',
            requestId,
        )
    }

    if (existingSession) {
        try {
            const ayah = await resolveAyahPayload(
                auth.supabase,
                (existingSession as SessionRow).ayah_key,
            )

            return apiSuccess(
                {
                    sessionId: existingSession.id,
                    ayah: {
                        ayahKey: ayah.ayahKey,
                        surahNumber: ayah.surahNumber,
                        ayahNumber: ayah.ayahNumber,
                        arabicText: ayah.arabicText,
                        translation: ayah.translation,
                        tafsirSnippet: ayah.tafsirSnippet,
                        audioUrl: ayah.audioUrl,
                    },
                    checkInId: parsed.data.checkInId,
                },
                'Existing Quran Moment loaded',
                { requestId },
            )
        } catch (error) {
            return errorFromStatus(
                502,
                'Unable to fetch Quran Moment content right now',
                requestId,
                error instanceof Error ? { cause: error.message } : undefined,
            )
        }
    }

    let candidates: CandidateRow[]
    let lastAyahKey: string | null

    try {
        const [loadedCandidates, loadedLastAyahKey] = await Promise.all([
            loadCandidates(auth.supabase, checkIn.category),
            loadLastSessionAyahKey(auth.supabase, auth.user.id),
        ])
        candidates = reorderCandidates(loadedCandidates, loadedLastAyahKey)
        lastAyahKey = loadedLastAyahKey
    } catch (error) {
        return errorFromStatus(
            500,
            error instanceof Error
                ? error.message
                : 'Failed to prepare recommendations',
            requestId,
        )
    }

    if (candidates.length === 0) {
        return errorFromStatus(
            404,
            'No ayah recommendation is configured',
            requestId,
        )
    }

    let chosenAyah: Awaited<ReturnType<typeof resolveAyahPayload>> | null = null
    let firstAttemptError: string | null = null

    for (const [index, candidate] of candidates.entries()) {
        try {
            chosenAyah = await resolveAyahPayload(
                auth.supabase,
                candidate.ayah_key,
            )
            break
        } catch (error) {
            if (index === 0 && error instanceof Error) {
                firstAttemptError = error.message
            }
        }
    }

    if (!chosenAyah) {
        return errorFromStatus(
            502,
            'Unable to fetch Quran Moment content right now',
            requestId,
            firstAttemptError
                ? { firstAttemptError, lastAyahKey }
                : { lastAyahKey },
        )
    }

    const { data: session, error: sessionError } = await auth.supabase
        .from('sessions')
        .insert({
            user_id: auth.user.id,
            check_in_id: checkIn.id,
            ayah_key: chosenAyah.ayahKey,
        })
        .select('id')
        .single()

    if (sessionError) {
        return errorFromStatus(500, 'Failed to create session', requestId)
    }

    return apiSuccess(
        {
            sessionId: session.id,
            ayah: {
                ayahKey: chosenAyah.ayahKey,
                surahNumber: chosenAyah.surahNumber,
                ayahNumber: chosenAyah.ayahNumber,
                arabicText: chosenAyah.arabicText,
                translation: chosenAyah.translation,
                tafsirSnippet: chosenAyah.tafsirSnippet,
                audioUrl: chosenAyah.audioUrl,
            },
            checkInId: parsed.data.checkInId,
        },
        'Quran Moment recommended',
        { requestId },
    )
}
