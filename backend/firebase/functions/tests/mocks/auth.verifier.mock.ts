import type { IAuthVerifier, TokenPayload } from '../../src/infrastructure/auth/auth.types'

export function createMockAuthVerifier(behaviors: {
  verifyIdToken?: (token: string) => Promise<TokenPayload> | TokenPayload
} = {}): IAuthVerifier {
  const verifyIdToken =
    behaviors.verifyIdToken ??
    (async () => ({ uid: 'mock-uid', email: 'mock@example.com' }))

  return {
    async verifyIdToken(token: string): Promise<TokenPayload> {
      return Promise.resolve(await verifyIdToken(token))
    },
  }
}
