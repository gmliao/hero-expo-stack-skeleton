import { ApiError, AuthError, PermissionError, TimeoutError, api } from '@/data/api'

global.fetch = jest.fn() as jest.Mock

describe('api client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('injects Authorization header on requests', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] }),
    })

    await api.getTodos('user-1')

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
    const requestUrl = new URL(url as string)
    expect(requestUrl.pathname).toBe('/api/todos')
    expect(requestUrl.search).toBe('')
    expect((options.headers as Headers).get('Authorization')).toBe('Bearer mock-token')
  })

  it('unwraps SuccessDto envelope to return data', async () => {
    const todos = [{ id: '1', title: 'Test', uid: 'user-1', completed: false, createdAt: '', updatedAt: '' }]
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: todos }),
    })

    const result = await api.getTodos('user-1')
    expect(result).toEqual(todos)
  })

  it('returns raw json when response is not SuccessDto', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: '1' }],
    })

    const result = await api.getTodos('user-1')
    expect(result).toEqual([{ id: '1' }])
  })

  it('maps 401 to AuthError', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: 'UNAUTHENTICATED', message: 'Unauthorized' }),
    })

    await expect(api.getTodos('user-1')).rejects.toBeInstanceOf(AuthError)
  })

  it('maps 403 to PermissionError', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: 'FORBIDDEN', message: 'Forbidden' }),
    })

    await expect(api.getTodos('user-1')).rejects.toBeInstanceOf(PermissionError)
  })

  it('maps other 4xx to ApiError', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: 'VALIDATION_ERROR', message: 'Bad Request' }),
    })

    await expect(api.getTodos('user-1')).rejects.toBeInstanceOf(ApiError)
  })

  it('fallback: maps non-FailureDto error body to ApiError', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Unexpected' }),
    })

    const err = await api.getTodos('user-1').catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('Unexpected')
  })

  it('fallback: uses HTTP status string when no error field', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => null,
    })

    const err = await api.getTodos('user-1').catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('HTTP 503')
  })

  it('retries twice on network error and then succeeds', async () => {
    ;(global.fetch as jest.Mock)
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      })

    await expect(api.getTodos('user-1')).resolves.toEqual([])
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('does not retry on 4xx errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: 'VALIDATION_ERROR', message: 'Bad Request' }),
    })

    await expect(api.getTodos('user-1')).rejects.toBeInstanceOf(ApiError)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on timeout and throws TimeoutError after final attempt', async () => {
    jest.useFakeTimers()

    try {
      ;(global.fetch as jest.Mock).mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal as AbortSignal | undefined

        return new Promise((_resolve, reject) => {
          signal?.addEventListener(
            'abort',
            () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            },
            { once: true }
          )
        })
      })

      const requestPromise = api.getTodos('user-1')
      const assertion = expect(requestPromise).rejects.toBeInstanceOf(TimeoutError)

      await jest.advanceTimersByTimeAsync(30_000)

      await assertion
      expect(global.fetch).toHaveBeenCalledTimes(3)
    } finally {
      jest.useRealTimers()
    }
  })
})
