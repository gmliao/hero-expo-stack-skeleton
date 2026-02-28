/**
 * Unit tests for auth middleware. No emulator needed — inject mock IAuthVerifier.
 */
import { Response } from 'express'
import { createRequireAuth } from '../src/middleware/auth'
import { createMockAuthVerifier } from './mocks/auth.verifier.mock'

describe('requireAuth (unit)', () => {
  function mockReq(overrides: { headers?: Record<string, string> } = {}) {
    return {
      headers: overrides.headers ?? {},
      uid: undefined as string | undefined,
      email: undefined as string | undefined,
    } as any
  }

  function mockRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any
  }

  const next = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when no Authorization header', async () => {
    const verifier = createMockAuthVerifier()
    const requireAuth = createRequireAuth(verifier)
    const req = mockReq()
    const res = mockRes()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing Authorization header' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when header does not start with Bearer ', async () => {
    const verifier = createMockAuthVerifier()
    const requireAuth = createRequireAuth(verifier)
    const req = mockReq({ headers: { authorization: 'Basic xyz' } })
    const res = mockRes()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing Authorization header' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 with INVALID_TOKEN when verifier throws', async () => {
    const verifier = createMockAuthVerifier({
      verifyIdToken: async () => {
        throw new Error('invalid')
      },
    })
    const requireAuth = createRequireAuth(verifier)
    const req = mockReq({ headers: { authorization: 'Bearer bad-token' } })
    const res = mockRes()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', code: 'INVALID_TOKEN' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 with TOKEN_EXPIRED when token is expired', async () => {
    const err = new Error('Token expired') as Error & { code?: string }
    err.code = 'auth/id-token-expired'
    const verifier = createMockAuthVerifier({
      verifyIdToken: async () => {
        throw err
      },
    })
    const requireAuth = createRequireAuth(verifier)
    const req = mockReq({ headers: { authorization: 'Bearer expired-token' } })
    const res = mockRes()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', code: 'TOKEN_EXPIRED' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next and sets req.uid when token is valid', async () => {
    const verifier = createMockAuthVerifier({
      verifyIdToken: async () => ({ uid: 'user-123', email: 'u@example.com' }),
    })
    const requireAuth = createRequireAuth(verifier)
    const req = mockReq({ headers: { authorization: 'Bearer valid-token' } })
    const res = mockRes()

    await requireAuth(req, res, next)

    expect(req.uid).toBe('user-123')
    expect(req.email).toBe('u@example.com')
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
