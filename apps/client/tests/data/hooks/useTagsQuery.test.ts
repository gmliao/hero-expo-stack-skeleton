import { QueryClient, QueryObserver, useQuery } from '@tanstack/react-query'

import type { Tag } from '@shared/types/api'
import { api } from '@/data/api'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { queryKeys } from '@/data/queryKeys'

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}))

jest.mock('@/data/api', () => ({
  api: {
    getTags: jest.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

describe('useTagsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useQuery as jest.Mock).mockReturnValue({})
  })

  it('uses tags list query key and api call', () => {
    useTagsQuery('user-1')

    expect(useQuery).toHaveBeenCalledTimes(1)
    const [options] = (useQuery as jest.Mock).mock.calls[0]

    expect(options.queryKey).toEqual(queryKeys.tags.list('user-1'))
    expect(options.enabled).toBe(true)

    options.queryFn()
    expect(api.getTags).toHaveBeenCalledWith()
  })

  it('disables query when uid is empty', () => {
    useTagsQuery('')

    const [options] = (useQuery as jest.Mock).mock.calls[0]
    expect(options.enabled).toBe(false)
  })

  it('success path returns tags data', async () => {
    const client = createTestQueryClient()
    const mockTags: Tag[] = [
      {
        id: 'tag-1',
        name: 'Work',
        emoji: '🧰',
        colorToken: 'tagTeal',
        uid: 'user-1',
        createdAt: '',
        updatedAt: '',
      },
    ]
    ;(api.getTags as jest.Mock).mockResolvedValue(mockTags)

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.tags.list('user-1'),
      queryFn: () => api.getTags(),
      retry: false,
    })
    const snapshots: Array<{ isPending: boolean; isSuccess: boolean; isError: boolean; data: unknown }> = []

    const unsubscribe = observer.subscribe((result) => {
      snapshots.push({
        isPending: result.isPending,
        isSuccess: result.isSuccess,
        isError: result.isError,
        data: result.data,
      })
    })

    await observer.refetch()

    expect(snapshots.some((s) => s.isPending)).toBe(true)
    expect(snapshots[snapshots.length - 1]?.isSuccess).toBe(true)
    expect(snapshots[snapshots.length - 1]?.data).toEqual(mockTags)

    unsubscribe()
    client.clear()
  })

  it('loading path starts with isPending true', async () => {
    const client = createTestQueryClient()
    let resolveFn!: (value: unknown) => void
    ;(api.getTags as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve
      }),
    )

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.tags.list('user-1'),
      queryFn: () => api.getTags(),
      retry: false,
    })
    const snapshots: Array<{ isPending: boolean }> = []

    const unsubscribe = observer.subscribe((result) => {
      snapshots.push({ isPending: result.isPending })
    })

    expect(snapshots.some((s) => s.isPending)).toBe(true)

    resolveFn([])
    await observer.refetch()

    unsubscribe()
    client.clear()
  })

  it('error path transitions to error state', async () => {
    const client = createTestQueryClient()
    ;(api.getTags as jest.Mock).mockRejectedValue(new Error('Network error'))

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.tags.list('user-1'),
      queryFn: () => api.getTags(),
      retry: false,
    })
    const snapshots: Array<{ isError: boolean; errorMessage: string | undefined }> = []

    const unsubscribe = observer.subscribe((result) => {
      snapshots.push({
        isError: result.isError,
        errorMessage: result.error instanceof Error ? result.error.message : undefined,
      })
    })

    await observer.refetch()

    expect(snapshots[snapshots.length - 1]?.isError).toBe(true)
    expect(snapshots[snapshots.length - 1]?.errorMessage).toBe('Network error')

    unsubscribe()
    client.clear()
  })
})
