import { searchQuran, type SearchQuranResult } from '@/lib/qf/mcp'
import { fetchQfAyahByKey, getCachedAyahPayload } from '@/lib/qf/content'
import { getDatabaseErrorCode } from '@/lib/api-route'
import { ServiceError } from '@/lib/services/error'
import type { ServiceContext } from '@/lib/types'

export type EchoVerse = {
    ayahKey: string
    surahNumber: number
    ayahNumber: number
    arabicText: string
    translation: string
    audioUrl: string
}

type SessionWithContext = {
    ayah_key: string
    check_ins: {
        category: string
    } | null
}

const ECHO_LIMIT = 1

/**
 * build a semantic search query from the session's category and verse translation.
 * uses the category as thematic context + the translation text for semantic matching.
 */
function buildEchoQuery(category: string, translationText: string): string {
    // use category as thematic anchor + first 200 chars of translation for semantic context
    const truncatedTranslation = translationText.slice(0, 200).trim()
    return `${category.replace(/_/g, ' ')} - ${truncatedTranslation}`
}

/**
 * normalize the verse key from MCP search results.
 * MCP may return keys as "ayah_key", "verse_key", or within nested structures.
 */
function extractVerseKey(result: SearchQuranResult): string | null {
    if (result.ayah_key) return result.ayah_key
    if (result.verse_key) return result.verse_key

    // some MCP responses nest the key differently
    if (typeof result === 'object') {
        for (const value of Object.values(result)) {
            if (
                typeof value === 'string' &&
                /^\d+:\d+$/.test(value)
            ) {
                return value
            }
        }
    }

    return null
}

/**
 * extract an EchoVerse directly from MCP search result data.
 * MCP returns: { ayah_key, surah, ayah, text (Arabic), translations: [{ text }] }
 */
function extractEchoFromMcpResult(result: SearchQuranResult): EchoVerse | null {
    const ayahKey = result.ayah_key ?? result.verse_key
    if (!ayahKey) return null

    const surahNumber =
        typeof result.surah === 'number'
            ? result.surah
            : Number.parseInt(ayahKey.split(':')[0] ?? '', 10)
    const ayahNumber =
        typeof result.ayah === 'number'
            ? result.ayah
            : Number.parseInt(ayahKey.split(':')[1] ?? '', 10)

    if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
        return null
    }

    const arabicText =
        typeof result.text === 'string' ? result.text : ''

    // extract translation from nested translations array
    let translation = ''
    if (Array.isArray(result.translations) && result.translations.length > 0) {
        const firstTranslation = result.translations[0] as
            | { text?: string }
            | undefined
        translation = firstTranslation?.text ?? ''
    } else if (typeof result.translation === 'string') {
        translation = result.translation
    }

    if (!arabicText && !translation) {
        return null
    }

    return {
        ayahKey,
        surahNumber,
        ayahNumber,
        arabicText,
        translation,
        audioUrl: '',
    }
}

/**
 * resolve a single echo verse - try MCP result data first, then cached DB, then Content API.
 * returns null if resolution fails (non-blocking).
 */
async function resolveEchoVerse(
    ctx: ServiceContext,
    ayahKey: string,
    mcpResult: SearchQuranResult | null,
): Promise<EchoVerse | null> {
    // try to use MCP result data directly (already has Arabic + translation)
    if (mcpResult) {
        const fromMcp = extractEchoFromMcpResult(mcpResult)
        if (fromMcp && fromMcp.arabicText && fromMcp.translation) {
            return fromMcp
        }
    }

    // try cached reference in our DB
    const { data: cached } = await ctx.supabase
        .from('quran_references')
        .select(
            'ayah_key, surah_number, ayah_number, arabic_text, translation_text, tafsir_snippet, audio_url',
        )
        .eq('ayah_key', ayahKey)
        .maybeSingle()

    const cachedPayload = getCachedAyahPayload(cached)

    if (cachedPayload) {
        return {
            ayahKey: cachedPayload.ayahKey,
            surahNumber: cachedPayload.surahNumber,
            ayahNumber: cachedPayload.ayahNumber,
            arabicText: cachedPayload.arabicText,
            translation: cachedPayload.translation,
            audioUrl: cachedPayload.audioUrl,
        }
    }

    // fetch from QF Content API
    try {
        const fetched = await fetchQfAyahByKey(ayahKey)

        // cache it for future use (fire-and-forget)
        void ctx.supabase.from('quran_references').upsert(
            {
                source: 'qf',
                surah_number: fetched.surahNumber,
                ayah_number: fetched.ayahNumber,
                ayah_key: fetched.ayahKey,
                arabic_text: fetched.arabicText,
                translation_text: fetched.translation,
                tafsir_snippet: fetched.tafsirSnippet || null,
                audio_url: fetched.audioUrl || null,
            },
            { onConflict: 'ayah_key', ignoreDuplicates: false },
        )

        return {
            ayahKey: fetched.ayahKey,
            surahNumber: fetched.surahNumber,
            ayahNumber: fetched.ayahNumber,
            arabicText: fetched.arabicText,
            translation: fetched.translation,
            audioUrl: fetched.audioUrl,
        }
    } catch {
        return null
    }
}

/**
 * F1ind semantically related "echo" verses for a completed session.
 *
 * Flow:
 * 1. load session context (ayah_key + category)
 * 2. load the translation text for the session's ayah
 * 3. build semantic query from category + translation
 * 4. call Quran MCP search_quran
 * 5. filter out the original ayah
 * 6. resolve each echo verse (cached or Content API)
 */
export async function findEchoes(
    ctx: ServiceContext,
    sessionId: string,
): Promise<EchoVerse[]> {
    // load session with check-in category
    const { data: session, error: sessionError } = await ctx.supabase
        .from('sessions')
        .select('ayah_key, check_ins(category)')
        .eq('id', sessionId)
        .eq('user_id', ctx.userId)
        .eq('completed', true)
        .maybeSingle()

    if (sessionError) {
        throw new ServiceError(500, 'Failed to load session for echoes')
    }

    if (!session) {
        throw new ServiceError(404, 'Completed session not found')
    }

    const typedSession = session as unknown as SessionWithContext
    const category = typedSession.check_ins?.category ?? 'guidance'
    const ayahKey = typedSession.ayah_key

    // load translation text for the session's ayah
    const { data: reference } = await ctx.supabase
        .from('quran_references')
        .select('translation_text')
        .eq('ayah_key', ayahKey)
        .maybeSingle()

    const translationText = reference?.translation_text ?? category

    // build semantic query
    const query = buildEchoQuery(category, translationText)

    // call Quran MCP semantic search
    let searchResults: SearchQuranResult[]

    try {
        searchResults = await searchQuran({
            query,
            limit: ECHO_LIMIT + 2, // fetch extra in case we need to filter
        })
    } catch {
        // MCP unavailable - return empty (non-blocking)
        return []
    }

    // filter out the original ayah and deduplicate
    const seenKeys = new Set<string>([ayahKey])
    const filteredResults: Array<{ key: string; result: SearchQuranResult }> = []

    for (const result of searchResults) {
        const verseKey = extractVerseKey(result)

        if (!verseKey || seenKeys.has(verseKey)) continue

        seenKeys.add(verseKey)
        filteredResults.push({ key: verseKey, result })
    }

    if (filteredResults.length === 0) {
        return []
    }

    // randomly pick ECHO_LIMIT verses for freshness
    const shuffled = filteredResults.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, ECHO_LIMIT)

    if (filteredResults.length === 0) {
        return []
    }

    // resolve each echo verse in parallel (using MCP data directly when available)
    const resolvedVerses = await Promise.all(
        selected.map(({ key, result }) =>
            resolveEchoVerse(ctx, key, result),
        ),
    )

    return resolvedVerses.filter(
        (verse): verse is EchoVerse => verse !== null,
    )
}

/**
 * save the original ayah + echo verses as a named collection.
 * uses the category to auto-generate a collection name (e.g., "Patience Echoes").
 * idempotent: if collection already exists, adds items without duplicating.
 */
export async function saveEchoesAsCollection(
    ctx: ServiceContext,
    sessionId: string,
    echoAyahKeys: string[],
) {
    // load session to get original ayah + category
    const { data: session, error: sessionError } = await ctx.supabase
        .from('sessions')
        .select('ayah_key, check_ins(category)')
        .eq('id', sessionId)
        .eq('user_id', ctx.userId)
        .eq('completed', true)
        .maybeSingle()

    if (sessionError) {
        throw new ServiceError(500, 'Failed to load session')
    }

    if (!session) {
        throw new ServiceError(404, 'Completed session not found')
    }

    const typedSession = session as unknown as SessionWithContext
    const category = typedSession.check_ins?.category ?? 'guidance'
    const originalAyahKey = typedSession.ayah_key

    // generate collection name from category
    const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const collectionName = `${categoryLabel} Echoes`

    // create or get existing collection
    const { data: insertedCollection, error: insertError } = await ctx.supabase
        .from('collections')
        .insert({ user_id: ctx.userId, name: collectionName })
        .select('id, name, created_at')
        .single()

    let collectionId: string

    if (insertError && getDatabaseErrorCode(insertError) === '23505') {
        // collection already exists — fetch it
        const { data: existing, error: existingError } = await ctx.supabase
            .from('collections')
            .select('id')
            .eq('user_id', ctx.userId)
            .eq('name', collectionName)
            .single()

        if (existingError || !existing) {
            throw new ServiceError(500, 'Failed to load existing collection')
        }

        collectionId = existing.id
    } else if (insertError) {
        throw new ServiceError(500, 'Failed to create echo collection')
    } else {
        collectionId = insertedCollection.id
    }

    // add original ayah + all echo ayahs to the collection (ignore duplicates)
    const allAyahKeys = [originalAyahKey, ...echoAyahKeys]

    for (const ayahKey of allAyahKeys) {
        const { error: itemError } = await ctx.supabase
            .from('collection_items')
            .insert({ collection_id: collectionId, ayah_key: ayahKey })
            .select('id')
            .single()

        // ignore duplicate constraint violations
        if (itemError && getDatabaseErrorCode(itemError) !== '23505') {
            // non-fatal, skip this item but continue with others
        }
    }

    return {
        collectionId,
        collectionName,
        itemCount: allAyahKeys.length,
    }
}
