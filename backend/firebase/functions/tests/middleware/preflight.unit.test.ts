/**
 * Unit tests for CORS preflight middleware. Ensures OPTIONS returns 204
 * with CORS headers and never calls next(); non-OPTIONS calls next().
 */
import type { Request, Response } from 'express'
import { preflightMiddleware } from '../../src/middleware/preflight'

describe('preflightMiddleware (unit)', () => {
  const mockNext = jest.fn()

  function mockRes() {
    const mockSet = jest.fn().mockReturnThis()
    const mockSendStatus = jest.fn()
    const res = { set: mockSet, sendStatus: mockSendStatus } as unknown as Response
    return { res, mockSet, mockSendStatus }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('responds 204 with CORS headers for OPTIONS and does not call next', () => {
    const { res, mockSet, mockSendStatus } = mockRes()
    const req = {
      method: 'OPTIONS',
      get: jest.fn((name: string) => (name === 'Origin' ? 'http://localhost:8081' : undefined)),
    } as unknown as Request

    preflightMiddleware(req, res, mockNext)

    expect(mockSet).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:8081')
    expect(mockSet).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE, OPTIONS',
    )
    expect(mockSet).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    )
    expect(mockSet).toHaveBeenCalledWith('Access-Control-Max-Age', '86400')
    expect(mockSendStatus).toHaveBeenCalledWith(204)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('uses * for Access-Control-Allow-Origin when Origin header is missing', () => {
    const { res, mockSet, mockSendStatus } = mockRes()
    const req = {
      method: 'OPTIONS',
      get: jest.fn(() => undefined),
    } as unknown as Request

    preflightMiddleware(req, res, mockNext)

    expect(mockSet).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    expect(mockSendStatus).toHaveBeenCalledWith(204)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('calls next() for non-OPTIONS and does not send response', () => {
    const { res, mockSet, mockSendStatus } = mockRes()
    const req = { method: 'GET', get: jest.fn() } as unknown as Request

    preflightMiddleware(req, res, mockNext)

    expect(mockSet).not.toHaveBeenCalled()
    expect(mockSendStatus).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
  })
})
