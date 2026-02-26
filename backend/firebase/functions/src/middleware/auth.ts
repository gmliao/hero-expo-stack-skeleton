import { Request, Response, NextFunction } from 'express'
import * as admin from 'firebase-admin'

export interface AuthenticatedRequest extends Request {
  uid?: string
  email?: string
}

export async function requireAuth(
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
    const decoded = await admin.auth().verifyIdToken(token)
    req.uid = decoded.uid
    req.email = decoded.email
    next()
  } catch (err: any) {
    const code = err.code === 'auth/id-token-expired' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    res.status(401).json({ error: 'Unauthorized', code })
  }
}
