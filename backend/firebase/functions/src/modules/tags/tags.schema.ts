import { z } from 'zod'

const nameSchema = z.string().min(1, 'name is required').max(50, 'name max 50 characters')

export const createTagBodySchema = z.object({
  name: nameSchema,
})

export const updateTagBodySchema = z.object({
  name: nameSchema,
})

export const tagIdParamsSchema = z.object({
  tagId: z.string().min(1, 'tagId is required'),
})

export type CreateTagBody = z.infer<typeof createTagBodySchema>
export type UpdateTagBody = z.infer<typeof updateTagBodySchema>
export type TagIdParams = z.infer<typeof tagIdParamsSchema>
