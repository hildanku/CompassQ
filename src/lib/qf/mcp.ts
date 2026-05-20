import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const MCP_URL = process.env.QURAN_MCP_URL ?? 'https://mcp.quran.ai/'

type ToolResult = {
    content?: Array<{ type: string; text?: string }>
    structuredContent?: unknown
    isError?: boolean
}

let clientPromise: Promise<Client> | null = null
let groundingNonce: string | null = null

async function getClient(): Promise<Client> {
    if (clientPromise) return clientPromise

    clientPromise = (async () => {
        const transport = new StreamableHTTPClientTransport(new URL(MCP_URL))
        const client = new Client(
            { name: 'compassq', version: '1.0.0' },
            { capabilities: {} },
        )
        await client.connect(transport)
        return client
    })().catch((err) => {
        clientPromise = null
        throw err
    })

    return clientPromise
}

function extractStructured(res: ToolResult): unknown {
    if (res.structuredContent !== undefined && res.structuredContent !== null) {
        return res.structuredContent
    }

    const text = res.content?.find((c) => c.type === 'text')?.text

    if (!text) return null

    try {
        return JSON.parse(text)
    } catch {
        return { _raw: text }
    }
}

async function ensureNonce(client: Client): Promise<string | null> {
    if (groundingNonce) return groundingNonce

    try {
        const res = (await client.callTool({
            name: 'fetch_grounding_rules',
            arguments: {},
        })) as ToolResult

        const data = extractStructured(res) as {
            grounding_nonce?: string
        } | null

        if (data?.grounding_nonce) {
            groundingNonce = data.grounding_nonce
        }
    } catch {
        // non-fatal, subsequent tool calls will receive grounding rules inline
    }

    return groundingNonce
}

export type SearchQuranResult = {
    ayah_key?: string
    verse_key?: string
    text?: string
    translation?: string
    score?: number
    [key: string]: unknown
}

/**
 * semantic search across the Quran using Quran MCP
 * returns verses that are semantically related to the query
 */
export async function searchQuran(opts: {
    query: string
    limit?: number
    translations?: string
}): Promise<SearchQuranResult[]> {
    const client = await getClient()
    const nonce = await ensureNonce(client)

    const args: Record<string, unknown> = {
        query: opts.query,
        translations: opts.translations ?? 'en-sahih-international',
    }

    if (nonce) args.grounding_nonce = nonce

    const res = (await client.callTool({
        name: 'search_quran',
        arguments: args,
    })) as ToolResult

    if (res.isError) {
        const msg =
            res.content?.find((c) => c.type === 'text')?.text ??
            'Unknown MCP error'
        throw new Error(`search_quran failed: ${msg}`)
    }

    const data = extractStructured(res)

    console.log('[mcp] search_quran raw response type:', typeof data, Array.isArray(data) ? 'array' : '')
    console.log('[mcp] search_quran raw response:', JSON.stringify(data).slice(0, 1000))

    // normalize response
    if (Array.isArray(data)) {
        return data as SearchQuranResult[]
    }

    if (data && typeof data === 'object' && 'results' in data) {
        return (data as { results: SearchQuranResult[] }).results
    }

    if (data && typeof data === 'object' && 'verses' in data) {
        return (data as { verses: SearchQuranResult[] }).verses
    }

    return []
}

// fetch Quran text for specific ayahs via MCP
export async function fetchQuranText(opts: {
    ayahs: string
    editions?: string
}): Promise<unknown> {
    const client = await getClient()
    const nonce = await ensureNonce(client)

    const args: Record<string, unknown> = {
        ayahs: opts.ayahs,
        editions: opts.editions ?? 'ar-simple-clean',
    }

    if (nonce) args.grounding_nonce = nonce

    const res = (await client.callTool({
        name: 'fetch_quran',
        arguments: args,
    })) as ToolResult

    if (res.isError) {
        const msg =
            res.content?.find((c) => c.type === 'text')?.text ??
            'Unknown MCP error'
        throw new Error(`fetch_quran failed: ${msg}`)
    }

    return extractStructured(res)
}

// fetch translation for specific ayahs via MCP
export async function fetchTranslation(opts: {
    ayahs: string
    editions?: string
}): Promise<unknown> {
    const client = await getClient()
    const nonce = await ensureNonce(client)

    const args: Record<string, unknown> = {
        ayahs: opts.ayahs,
        editions: opts.editions ?? 'en-sahih-international',
    }

    if (nonce) args.grounding_nonce = nonce

    const res = (await client.callTool({
        name: 'fetch_translation',
        arguments: args,
    })) as ToolResult

    if (res.isError) {
        const msg =
            res.content?.find((c) => c.type === 'text')?.text ??
            'Unknown MCP error'
        throw new Error(`fetch_translation failed: ${msg}`)
    }

    return extractStructured(res)
}
