const mockVerifyIdToken = jest.fn()

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}))

import { getAuth } from 'firebase-admin/auth'
import { FirebaseAuthVerifier } from '../../../src/infrastructure/auth/auth.firebase.service'

describe('FirebaseAuthVerifier (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns uid and email from the decoded token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'user-1',
      email: 'user-1@example.com',
      admin: true,
    })

    const verifier = new FirebaseAuthVerifier()
    await expect(verifier.verifyIdToken('token-123')).resolves.toEqual({
      uid: 'user-1',
      email: 'user-1@example.com',
    })

    expect(getAuth).toHaveBeenCalledTimes(1)
    expect(mockVerifyIdToken).toHaveBeenCalledWith('token-123')
  })
})
