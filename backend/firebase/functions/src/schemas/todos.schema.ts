import { z } from 'zod'

export const createTodoSchema = z.object({
  title: z.string().min(1, 'title is required').transform(s => s.trim()),
  description: z.string().optional().default(''),
  dueDate: z
    .union([z.string(), z.undefined(), z.null()])
    .transform(v => (v != null && String(v).trim() ? String(v).trim() : undefined)),
})

export const updateTodoSchema = z.object({
  title: z.string().min(1).transform(s => s.trim()).optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  dueDate: z.union([z.string(), z.null(), z.undefined()]).optional(),
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
