import { getAuth } from 'firebase-admin/auth'
import type { IAuthVerifier, TokenPayload } from './auth.types'

export class FirebaseAuthVerifier implements IAuthVerifier {
  async verifyIdToken(token: string): Promise<TokenPayload> {
    const decoded = await getAuth().verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email,
    }
  }
}
