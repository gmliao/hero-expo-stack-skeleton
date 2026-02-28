import type { Request, Response } from 'express'
import { NotFoundError } from '../src/lib/errors'
import { exceptionMiddleware } from '../src/middleware/error'

describe('exceptionMiddleware (unit)', () => {
  const mockReq = { get: jest.fn() } as unknown as Request
  const mockNext = jest.fn()

  function mockRes(): {
    res: Response
    mockStatus: jest.Mock
    mockJson: jest.Mock
    mockSet: jest.Mock
  } {
    const mockJson = jest.fn()
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    const mockSet = jest.fn().mockReturnThis()
    const res = { status: mockStatus, set: mockSet } as unknown as Response
    return { res, mockStatus, mockJson, mockSet }
  }

  it('returns 404 and FailureDto when err is NotFoundError("x")', () => {
    const { res, mockStatus, mockJson } = mockRes()

    exceptionMiddleware(new NotFoundError('x'), mockReq, res, mockNext)

    expect(mockStatus).toHaveBeenCalledWith(404)
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'x',
      }),
    )
  })

  it('returns 500 and Internal server error when err is generic Error', () => {
    const { res, mockStatus, mockJson } = mockRes()

    exceptionMiddleware(new Error('something'), mockReq, res, mockNext)

    expect(mockStatus).toHaveBeenCalledWith(500)
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    })
  })

  it('sets CORS headers on every error response', () => {
    const { res, mockSet } = mockRes()
    jest.mocked(mockReq.get).mockReturnValue('http://localhost:8081')

    exceptionMiddleware(new NotFoundError('x'), mockReq, res, mockNext)

    expect(mockSet).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:8081')
    expect(mockSet).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE, OPTIONS',
    )
    expect(mockSet).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    )
  })
})
