import { z } from 'zod'

export const checkInCategoryValues = [
    'anxiety',
    'gratitude',
    'patience',
    'guidance',
    'hope',
    'discipline',
    'feeling_distant',
    'need_comfort',
] as const

export const checkInCategorySchema = z.enum(checkInCategoryValues)

export const profileResponseSchema = z.object({
    profile: z.object({
        id: z.uuid(),
        displayName: z.string().nullable(),
        timezone: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    }),
})

export const updateProfileSchema = z
    .object({
        displayName: z.string().trim().max(80).optional(),
        timezone: z.string().trim().min(1).optional(),
    })
    .refine(
        (value) =>
            value.displayName !== undefined || value.timezone !== undefined,
        {
            message: 'At least one profile field is required',
            path: ['displayName'],
        },
    )

export const createCheckInSchema = z.object({
    category: checkInCategorySchema,
    notes: z.string().trim().max(500).optional(),
})

export const recommendMomentSchema = z.object({
    checkInId: z.uuid(),
})

export const createReflectionSchema = z.object({
    sessionId: z.uuid(),
    content: z.string().trim().max(280),
})

export const createBookmarkSchema = z.object({
    ayahKey: z.string().trim().min(1).max(32),
})

export const createCollectionSchema = z.object({
    name: z.string().trim().min(1).max(120),
})

export const addCollectionItemSchema = z.object({
    ayahKey: z.string().trim().min(1).max(32),
})

export const historyQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
})

export const weeklyInsightsQuerySchema = z.object({
    weekStart: z.iso.date(),
})

export type ProfileResponseData = z.infer<typeof profileResponseSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>
export type RecommendMomentInput = z.infer<typeof recommendMomentSchema>
export type CreateReflectionInput = z.infer<typeof createReflectionSchema>
export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type AddCollectionItemInput = z.infer<typeof addCollectionItemSchema>
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>
export type WeeklyInsightsQueryInput = z.infer<typeof weeklyInsightsQuerySchema>
