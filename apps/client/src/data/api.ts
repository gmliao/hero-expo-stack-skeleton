import type { CreateTodoRequest, Todo, UpdateTodoRequest } from '@shared/types/api'

import { firebaseAuth } from '@/lib/firebase'
import { env } from '@/lib/env'

const DEFAULT_TIMEOUT_MS = 10_000
const MAX_RETRIES = 2

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthError extends ApiError {
  constructor(message: string, status: number = 401) {
    super(message, status)
    this.name = 'AuthError'
  }
}

export class PermissionError extends ApiError {
  constructor(message: string, status: number = 403) {
    super(message, status)
    this.name = 'PermissionError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

const getToken = async (): Promise<string> => {
  const user = firebaseAuth.currentUser

  if (!user) {
    throw new Error('Not authenticated')
  }

  return user.getIdToken()
}

const isAbortError = (error: unknown): boolean => {
  return error instanceof DOMException && error.name === 'AbortError'
}

const isRetryableError = (error: unknown): boolean => {
  return error instanceof TimeoutError || error instanceof TypeError
}

const toHttpError = (status: number, message: string): Error => {
  if (status === 401) {
    return new AuthError(message, status)
  }

  if (status === 403) {
    return new PermissionError(message, status)
  }

  if (status >= 400 && status < 500) {
    return new ApiError(message, status)
  }

  return new Error(message)
}

const handleUnauthorized = async (): Promise<void> => {
  try {
    await firebaseAuth.signOut()
  } catch {
    // Ignore sign-out failures: request should still surface as auth error.
  }
}

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw new TimeoutError(`Request timed out after ${timeoutMs}ms`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const request = async <T>(path: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> => {
  const token = await getToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${token}`)

  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        `${env.FUNCTIONS_URL}/api${path}`,
        {
          ...options,
          headers,
        },
        timeoutMs
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = typeof body?.error === 'string' ? body.error : `HTTP ${response.status}`

        if (response.status === 401) {
          await handleUnauthorized()
        }

        throw toHttpError(response.status, message)
      }

      if (response.status === 204) {
        return undefined as T
      }

      return response.json() as Promise<T>
    } catch (error) {
      lastError = error

      if (!isRetryableError(error) || attempt === MAX_RETRIES) {
        throw error
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown API error')
}

export const api = {
  getTodos: (uid: string) => request<Todo[]>(`/todos?uid=${uid}`),
  createTodo: (body: CreateTodoRequest) =>
    request<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  toggleTodo: (id: string) =>
    request<Todo>(`/todos/${id}/toggle`, {
      method: 'PATCH',
    }),
  updateTodo: (id: string, body: UpdateTodoRequest) =>
    request<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteTodo: (id: string) =>
    request<void>(`/todos/${id}`, {
      method: 'DELETE',
    }),
}
