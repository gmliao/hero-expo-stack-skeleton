import type { Request, Response } from 'express'
import { BadRequestError } from '../src/lib/errors'
import { validateBody } from '../src/lib/validate'
import { createTodoSchema } from '../src/schemas/todos.schema'

describe('validateBody (unit)', () => {
  const mockNext = jest.fn()
  let mockRes: { status: jest.Mock; json: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('throws BadRequestError when schema fails', () => {
    const req = { body: { title: '' } } as Request

    expect(() => {
      validateBody(createTodoSchema)(req, mockRes as unknown as Response, mockNext)
    }).toThrow(BadRequestError)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('sets req.validatedBody to parsed value (e.g. title trimmed) and calls next when schema succeeds', () => {
    const req = { body: { title: '  hello  ' } } as Request

    validateBody(createTodoSchema)(req, mockRes as unknown as Response, mockNext)

    expect((req as Request & { validatedBody?: unknown }).validatedBody).toEqual({
      title: 'hello',
      description: '',
      dueDate: undefined,
    })
    expect(mockNext).toHaveBeenCalledTimes(1)
  })
})
