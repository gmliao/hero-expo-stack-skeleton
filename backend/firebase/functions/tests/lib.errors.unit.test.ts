import { HttpError, NotFoundError, UnauthorizedError } from '../src/lib/errors'

describe('HttpError family (unit)', () => {
  it('NotFoundError has statusCode 404', () => {
    const err = new NotFoundError('Missing')
    expect(err.statusCode).toBe(404)
  })

  it('UnauthorizedError preserves code', () => {
    const err = new UnauthorizedError('Unauthorized', { code: 'INVALID_TOKEN' })
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('INVALID_TOKEN')
  })

  describe('instanceof and message', () => {
    it('NotFoundError is instanceof HttpError and Error', () => {
      const err = new NotFoundError('Resource missing')
      expect(err).toBeInstanceOf(NotFoundError)
      expect(err).toBeInstanceOf(HttpError)
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe('Resource missing')
    })

    it('UnauthorizedError is instanceof HttpError and Error', () => {
      const err = new UnauthorizedError('Invalid token')
      expect(err).toBeInstanceOf(UnauthorizedError)
      expect(err).toBeInstanceOf(HttpError)
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe('Invalid token')
    })
  })

  describe('code default behavior', () => {
    it('NotFoundError has no code when not provided', () => {
      const err = new NotFoundError()
      expect(err.code).toBeUndefined()
      expect(err.message).toBe('Not Found')
    })

    it('UnauthorizedError has code when provided, undefined when not', () => {
      const withCode = new UnauthorizedError('Unauthorized', { code: 'TOKEN_EXPIRED' })
      expect(withCode.code).toBe('TOKEN_EXPIRED')
      const withoutCode = new UnauthorizedError()
      expect(withoutCode.code).toBeUndefined()
      expect(withoutCode.message).toBe('Unauthorized')
    })
  })
})

