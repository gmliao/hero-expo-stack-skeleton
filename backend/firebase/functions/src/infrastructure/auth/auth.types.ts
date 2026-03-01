/**
 * Auth verifier interface — abstracts Firebase Auth token verification.
 * Swap implementation for tests (mock) or production (Firebase).
 */
export interface TokenPayload {
  uid: string
  email?: string
}

export interface IAuthVerifier {
  verifyIdToken(token: string): Promise<TokenPayload>
}
