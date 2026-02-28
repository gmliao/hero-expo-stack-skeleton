import { Request, Response, NextFunction } from 'express'
import type { IAuthVerifier } from '../services/auth.types'

export interface AuthenticatedRequest extends Request {
  uid?: string
  email?: string
}

export function createRequireAuth(verifier: IAuthVerifier) {
  return async function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing Authorization header' })
      return
    }

    const token = header.slice(7)
    try {
      const decoded = await verifier.verifyIdToken(token)
      req.uid = decoded.uid
      req.email = decoded.email
      next()
    } catch (err: unknown) {
      const code =
        (err as { code?: string })?.code === 'auth/id-token-expired'
          ? 'TOKEN_EXPIRED'
          : 'INVALID_TOKEN'
      res.status(401).json({ error: 'Unauthorized', code })
    }
  }
}
