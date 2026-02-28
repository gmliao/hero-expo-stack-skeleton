export type HttpErrorOptions = {
  code?: string
}

export class HttpError extends Error {
  public readonly statusCode: number
  public readonly code?: string

  constructor(statusCode: number, message: string, options: HttpErrorOptions = {}) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = options.code
    Error.captureStackTrace?.(this, new.target)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', options: HttpErrorOptions = {}) {
    super(404, message, options)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', options: HttpErrorOptions = {}) {
    super(401, message, options)
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', options: HttpErrorOptions = {}) {
    super(400, message, options)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', options: HttpErrorOptions = {}) {
    super(403, message, options)
  }
}

