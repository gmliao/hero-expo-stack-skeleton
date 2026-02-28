import { Request, Response, NextFunction } from 'express'
import type { IAuthVerifier } from '../services/auth.types'
import { UnauthorizedError } from '../lib/errors'

export interface AuthenticatedRequest extends Request {
  uid?: string
  email?: string
}

export function createRequireAuth(verifier: IAuthVerifier) {
  return async function requireAuth(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing Authorization header', {
        code: 'MISSING_AUTH_HEADER',
      })
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
      throw new UnauthorizedError('Unauthorized', { code })
    }
  }
}
