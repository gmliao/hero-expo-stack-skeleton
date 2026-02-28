import type { NextFunction, Request, Response } from 'express'

/**
 * Handles CORS preflight (OPTIONS) before auth. Ensures preflight always
 * returns 204 with CORS headers so it never hits requireAuth.
 */
export function preflightMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.method === 'OPTIONS') {
    const origin = req.get('Origin') ?? '*'
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.set('Access-Control-Max-Age', '86400')
    res.sendStatus(204)
    return
  }
  next()
}
