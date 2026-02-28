import * as admin from 'firebase-admin'
import type { IAuthVerifier, TokenPayload } from './auth.types'

export class FirebaseAuthVerifier implements IAuthVerifier {
  async verifyIdToken(token: string): Promise<TokenPayload> {
    const decoded = await admin.auth().verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email,
    }
  }
}
