import type { SupabaseClient } from '@supabase/supabase-js'

import {
    fetchQfAyahByKey,
    getCachedAyahPayload,
    getQfContentConfig,
} from '@/lib/qf-content'
import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'

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
    supabase: SupabaseClient,
    category: CheckInRow['category'],
) {
    const { data, error } = await supabase
        .from('recommendation_catalog')
        .select('ayah_key, priority')
        .eq('category', category)
        .eq('is_active', true)
        .order('priority', { ascending: true })

    if (error) {
        throw new ServiceError(500, 'Failed to load recommendation catalog')
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
        throw new ServiceError(
            500,
            'Failed to load fallback recommendation catalog',
        )
    }

    return fallbackData as CandidateRow[]
}

async function loadLastSessionAyahKey(
    supabase: SupabaseClient,
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
        throw new ServiceError(500, 'Failed to load last session')
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

async function loadCachedReference(supabase: SupabaseClient, ayahKey: string) {
    const { data, error } = await supabase
        .from('quran_references')
        .select(
            'ayah_key, surah_number, ayah_number, arabic_text, translation_text, tafsir_snippet, audio_url',
        )
        .eq('ayah_key', ayahKey)
        .maybeSingle()

    if (error) {
        throw new ServiceError(500, 'Failed to load cached ayah reference')
    }

    return data as CachedReferenceRow | null
}

async function persistAyahReference(
    supabase: SupabaseClient,
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
        throw new ServiceError(500, 'Failed to cache ayah reference')
    }
}

async function resolveAyahPayload(supabase: SupabaseClient, ayahKey: string) {
    const cachedReference = await loadCachedReference(supabase, ayahKey)
    const cachedPayload = getCachedAyahPayload(cachedReference)

    if (cachedPayload) {
        return cachedPayload
    }

    try {
        const fetchedAyah = await fetchQfAyahByKey(ayahKey)
        await persistAyahReference(supabase, fetchedAyah)

        return fetchedAyah
    } catch (error) {
        throw new ServiceError(
            502,
            'Unable to fetch Quran Moment content right now',
            error instanceof Error ? { cause: error.message } : undefined,
        )
    }
}

function toMomentPayload(
    sessionId: string,
    checkInId: string,
    ayah: Awaited<ReturnType<typeof resolveAyahPayload>>,
) {
    return {
        sessionId,
        ayah: {
            ayahKey: ayah.ayahKey,
            surahNumber: ayah.surahNumber,
            ayahNumber: ayah.ayahNumber,
            arabicText: ayah.arabicText,
            translation: ayah.translation,
            tafsirSnippet: ayah.tafsirSnippet,
            audioUrl: ayah.audioUrl,
        },
        checkInId,
    }
}

export async function recommendMoment(
    { supabase, userId }: ServiceContext,
    checkInId: string,
) {
    try {
        getQfContentConfig()
    } catch {
        throw new ServiceError(
            503,
            'Quran Foundation content API is not configured',
        )
    }

    const { data: checkIn, error: checkInError } = await supabase
        .from('check_ins')
        .select('id, category')
        .eq('id', checkInId)
        .eq('user_id', userId)
        .maybeSingle()

    if (checkInError) {
        throw new ServiceError(500, 'Failed to load check-in')
    }

    if (!checkIn) {
        throw new ServiceError(404, 'Check-in not found')
    }

    const { data: existingSession, error: existingSessionError } =
        await supabase
            .from('sessions')
            .select('id, ayah_key')
            .eq('user_id', userId)
            .eq('check_in_id', checkIn.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

    if (existingSessionError) {
        throw new ServiceError(500, 'Failed to load existing session')
    }

    if (existingSession) {
        const ayah = await resolveAyahPayload(
            supabase,
            (existingSession as SessionRow).ayah_key,
        )

        return {
            message: 'Existing Quran Moment loaded',
            data: toMomentPayload(existingSession.id, checkInId, ayah),
        }
    }

    const [loadedCandidates, lastAyahKey] = await Promise.all([
        loadCandidates(supabase, (checkIn as CheckInRow).category),
        loadLastSessionAyahKey(supabase, userId),
    ])

    const candidates = reorderCandidates(loadedCandidates, lastAyahKey)

    if (candidates.length === 0) {
        throw new ServiceError(404, 'No ayah recommendation is configured')
    }

    let chosenAyah: Awaited<ReturnType<typeof resolveAyahPayload>> | null = null
    let firstAttemptError: unknown

    for (const [index, candidate] of candidates.entries()) {
        try {
            chosenAyah = await resolveAyahPayload(supabase, candidate.ayah_key)
            break
        } catch (error) {
            if (index === 0) {
                firstAttemptError = error
            }
        }
    }

    if (!chosenAyah) {
        const details =
            firstAttemptError instanceof ServiceError &&
            firstAttemptError.details
                ? { ...firstAttemptError.details, lastAyahKey }
                : { lastAyahKey }

        throw new ServiceError(
            502,
            'Unable to fetch Quran Moment content right now',
            details,
        )
    }

    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
            user_id: userId,
            check_in_id: checkIn.id,
            ayah_key: chosenAyah.ayahKey,
        })
        .select('id')
        .single()

    if (sessionError) {
        throw new ServiceError(500, 'Failed to create session')
    }

    return {
        message: 'Quran Moment recommended',
        data: toMomentPayload(session.id, checkInId, chosenAyah),
    }
}
