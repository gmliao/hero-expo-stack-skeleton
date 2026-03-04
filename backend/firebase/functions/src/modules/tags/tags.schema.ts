import { z } from 'zod'

const nameSchema = z.string().min(1, 'name is required').max(50, 'name max 50 characters')
const emojiSchema = z.string().trim().min(1, 'emoji is required')
const colorTokenSchema = z.enum(['tagTeal', 'tagBlue', 'tagGreen', 'tagAmber', 'tagRose'])

export const createTagBodySchema = z.object({
  name: nameSchema,
  emoji: emojiSchema,
  colorToken: colorTokenSchema,
})

export const updateTagBodySchema = z.object({
  name: nameSchema,
  emoji: emojiSchema,
  colorToken: colorTokenSchema,
})

export const tagIdParamsSchema = z.object({
  tagId: z.string().min(1, 'tagId is required'),
})

export type CreateTagBody = z.infer<typeof createTagBodySchema>
export type UpdateTagBody = z.infer<typeof updateTagBodySchema>
export type TagIdParams = z.infer<typeof tagIdParamsSchema>
