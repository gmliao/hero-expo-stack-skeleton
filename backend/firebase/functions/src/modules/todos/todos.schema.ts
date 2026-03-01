import { z } from 'zod'

const trimmedNonEmptyString = z.string().transform(s => s.trim()).pipe(z.string().min(1, 'title is required'))

export const createTodoSchema = z.object({
  title: trimmedNonEmptyString,
  description: z.string().optional().default(''),
  dueDate: z
    .union([z.string(), z.undefined(), z.null()])
    .transform(v => (v != null && String(v).trim() ? String(v).trim() : undefined)),
})

export const updateTodoSchema = z.object({
  title: z
    .string()
    .optional()
    .transform(s => (s === undefined ? undefined : s.trim()))
    .pipe(z.union([z.string().min(1, 'title cannot be empty'), z.undefined()])),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  dueDate: z.union([z.string(), z.null(), z.undefined()]).optional(),
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
