import { QueryClient, QueryObserver, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useToggleTodoMutation } from '@/data/hooks/useToggleTodoMutation'
import { useTodosQuery } from '@/data/hooks/useTodosQuery'
import { queryKeys } from '@/data/queryKeys'

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

jest.mock('@/data/api', () => ({
  api: {
    getTodos: jest.fn(),
    createTodo: jest.fn(),
    toggleTodo: jest.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

describe('useTodosQuery wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useQuery as jest.Mock).mockReturnValue({})
  })

  it('uses todos list query key and api call', () => {
    useTodosQuery('user-1')

    expect(useQuery).toHaveBeenCalledTimes(1)
    const [options] = (useQuery as jest.Mock).mock.calls[0]

    expect(options.queryKey).toEqual(queryKeys.todos.list('user-1'))
    expect(options.enabled).toBe(true)

    options.queryFn()
    expect(api.getTodos).toHaveBeenCalledWith('user-1')
  })

  it('disables query when uid is empty', () => {
    useTodosQuery('')

    const [options] = (useQuery as jest.Mock).mock.calls[0]
    expect(options.enabled).toBe(false)
  })
})

describe('useTodosQuery behavior contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('success path transitions to success with todos', async () => {
    const client = createTestQueryClient()
    const mockTodos = [{ id: '1', title: 'Todo', uid: 'user-1', completed: false, createdAt: '', updatedAt: '' }]
    ;(api.getTodos as jest.Mock).mockResolvedValue(mockTodos)

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.todos.list('user-1'),
      queryFn: () => api.getTodos('user-1'),
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
    expect(snapshots[snapshots.length - 1]?.data).toEqual(mockTodos)

    unsubscribe()
    client.clear()
  })

  it('error path transitions to error state', async () => {
    const client = createTestQueryClient()
    ;(api.getTodos as jest.Mock).mockRejectedValue(new Error('Network error'))

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.todos.list('user-1'),
      queryFn: () => api.getTodos('user-1'),
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

describe('todo mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useMutation as jest.Mock).mockReturnValue({})
  })

  it('invalidates todos.lists() on create success', async () => {
    const invalidateQueries = jest.fn()
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })

    useCreateTodoMutation()

    expect(useMutation).toHaveBeenCalledTimes(1)
    const [options] = (useMutation as jest.Mock).mock.calls[0]
    await options.mutationFn({ title: 'New' })
    expect(api.createTodo).toHaveBeenCalledWith({ title: 'New' })

    await options.onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.todos.lists() })
  })

  it('invalidates todos.lists() on toggle success', async () => {
    const invalidateQueries = jest.fn()
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })

    useToggleTodoMutation()

    expect(useMutation).toHaveBeenCalledTimes(1)
    const [options] = (useMutation as jest.Mock).mock.calls[0]
    await options.mutationFn('todo-1')
    expect(api.toggleTodo).toHaveBeenCalledWith('todo-1')

    await options.onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.todos.lists() })
  })
})
