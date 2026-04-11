import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireApiUserMock } = vi.hoisted(() => ({
    requireApiUserMock: vi.fn(),
}))

vi.mock('@/lib/api-auth', () => ({
    requireApiUser: requireApiUserMock,
}))

function createSupabaseMock(sequence: Record<string, unknown[]>) {
    const queues = Object.fromEntries(
        Object.entries(sequence).map(([table, builders]) => [
            table,
            [...builders],
        ]),
    )

    return {
        from: vi.fn((table: string) => {
            const nextBuilder = queues[table]?.shift()

            if (!nextBuilder) {
                throw new Error(`Unexpected table access: ${table}`)
            }

            return nextBuilder
        }),
    }
}

function createReferenceLookupBuilder(ayahKey: string) {
    const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        maybeSingle: vi.fn(async () => ({
            data: { ayah_key: ayahKey },
            error: null,
        })),
    }

    return builder
}

function createSingleQueryBuilder<T>(result: T) {
    const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(async () => ({
            data: result,
            error: null,
        })),
        maybeSingle: vi.fn(async () => ({
            data: result,
            error: null,
        })),
    }

    return builder
}

function createInsertBuilder<T>(
    result: T,
    error: { code: string } | null = null,
) {
    const builder = {
        insert: vi.fn(() => builder),
        select: vi.fn(() => builder),
        single: vi.fn(async () => ({
            data: error ? null : result,
            error,
        })),
    }

    return builder
}

describe('save action routes', () => {
    beforeEach(() => {
        requireApiUserMock.mockReset()
    })

    it('returns existing bookmark on duplicate bookmark create', async () => {
        const { POST } = await import('./bookmarks/route')
        const supabase = createSupabaseMock({
            quran_references: [createReferenceLookupBuilder('2:255')],
            bookmarks: [
                createInsertBuilder(null, { code: '23505' }),
                createSingleQueryBuilder({
                    id: 'bookmark-1',
                    ayah_key: '2:255',
                    created_at: '2026-04-11T10:00:00.000Z',
                }),
            ],
        })

        requireApiUserMock.mockResolvedValue({
            supabase,
            user: { id: 'user-1' },
        })

        const response = await POST(
            new Request('http://localhost/api/v1/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ayahKey: '2:255' }),
            }),
        )

        if (!response) {
            throw new Error('Bookmark route did not return a response')
        }

        const payload = await response.json()

        expect(response.status).toBe(200)
        expect(payload.message).toBe('Bookmark already exists')
        expect(payload.data).toMatchObject({
            bookmarkId: 'bookmark-1',
            ayahKey: '2:255',
            created: false,
        })
    })

    it('returns existing collection on duplicate collection create', async () => {
        const { POST } = await import('./collections/route')
        const supabase = createSupabaseMock({
            collections: [
                createInsertBuilder(null, { code: '23505' }),
                createSingleQueryBuilder({
                    id: 'collection-1',
                    name: 'Comfort verses',
                    created_at: '2026-04-11T10:00:00.000Z',
                }),
            ],
        })

        requireApiUserMock.mockResolvedValue({
            supabase,
            user: { id: 'user-1' },
        })

        const response = await POST(
            new Request('http://localhost/api/v1/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: 'Comfort verses' }),
            }),
        )

        if (!response) {
            throw new Error('Collections route did not return a response')
        }

        const payload = await response.json()

        expect(response.status).toBe(200)
        expect(payload.message).toBe('Collection already exists')
        expect(payload.data).toMatchObject({
            collectionId: 'collection-1',
            name: 'Comfort verses',
            created: false,
        })
    })

    it('returns existing collection item on duplicate add', async () => {
        const { POST } = await import('./collections/[id]/items/route')
        const supabase = createSupabaseMock({
            collections: [createSingleQueryBuilder({ id: 'collection-1' })],
            quran_references: [createReferenceLookupBuilder('2:255')],
            collection_items: [
                createInsertBuilder(null, { code: '23505' }),
                createSingleQueryBuilder({
                    id: 'item-1',
                    collection_id: 'collection-1',
                    ayah_key: '2:255',
                    created_at: '2026-04-11T10:00:00.000Z',
                }),
            ],
        })

        requireApiUserMock.mockResolvedValue({
            supabase,
            user: { id: 'user-1' },
        })

        const response = await POST(
            new Request(
                'http://localhost/api/v1/collections/collection-1/items',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ayahKey: '2:255' }),
                },
            ),
            {
                params: Promise.resolve({
                    id: '8f1dd6af-5f61-4e26-b0e4-4adb8f801f14',
                }),
            },
        )

        if (!response) {
            throw new Error('Collection items route did not return a response')
        }

        const payload = await response.json()

        expect(response.status).toBe(200)
        expect(payload.message).toBe('Collection item already exists')
        expect(payload.data).toMatchObject({
            collectionItemId: 'item-1',
            ayahKey: '2:255',
            created: false,
        })
    })
})
