import { Response } from 'express'
import { z } from 'zod'

/** Parses body with schema; returns parsed data or sends 400 and returns null */
export function parseBody<T>(
  res: Response,
  body: unknown,
  schema: z.ZodSchema<T>,
): T | null {
  const result = schema.safeParse(body)
  if (result.success) {
    return result.data
  }
  const first = result.error.issues[0]
  const message = first?.message ?? 'Validation failed'
  const path = first?.path?.length ? first.path.join('.') : undefined
  res.status(400).json({
    success: false,
    error: message,
    message: path ? `${path}: ${message}` : message,
  } satisfies { success: false; error: string; message?: string })
  return null
}
