import type { Request, Response, NextFunction } from 'express'
import { HttpError } from '../lib/errors'
import type { FailureDto } from '../types/api'

function setCorsHeaders(req: Request, res: Response): void {
  const origin = req.get('Origin')
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin)
  } else {
    res.set('Access-Control-Allow-Origin', '*')
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export function exceptionMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  setCorsHeaders(req, res)
  if (err instanceof HttpError) {
    const body: FailureDto = {
      success: false,
      error: err.message,
      ...(err.code != null && { code: err.code }),
      ...(err.message != null && { message: err.message }),
    }
    res.status(err.statusCode).json(body)
    return
  }
  console.error('[500]', req.method, req.path, err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  } satisfies FailureDto)
}
