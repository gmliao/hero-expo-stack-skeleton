import type { Request, RequestHandler, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from './errors'

/** Request with body validated by validateBody middleware */
export interface ValidatedBodyRequest<T> extends Request {
  validatedBody: T
}

/** Returns Express middleware that parses req.body with schema; on success sets req.validatedBody and calls next(); on failure throws BadRequestError */
export function validateBody<T>(schema: z.ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: () => void) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const first = result.error.issues[0]
      const message = first?.message ?? 'Validation failed'
      throw new BadRequestError(message)
    }
    ;(req as ValidatedBodyRequest<T>).validatedBody = result.data
    next()
  }
}

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
