import { QueryClient, QueryObserver, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Todo } from '@shared/types/api'
import { api } from '@/data/api'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useDeleteTodoMutation } from '@/data/hooks/useDeleteTodoMutation'
import { useToggleTodoMutation } from '@/data/hooks/useToggleTodoMutation'
import { useUpdateTodoMutation } from '@/data/hooks/useUpdateTodoMutation'
import { filterAndSortTodos, useTodosQuery } from '@/data/hooks/useTodosQuery'
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
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
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

    expect(options.queryKey).toEqual(queryKeys.todos.list('user-1', 'all'))
    expect(options.enabled).toBe(true)

    options.queryFn()
    expect(api.getTodos).toHaveBeenCalledWith('user-1')
  })

  it('uses query key with filter when filter is passed', () => {
    useTodosQuery('user-1', 'active')
    const [options] = (useQuery as jest.Mock).mock.calls[0]
    expect(options.queryKey).toEqual(queryKeys.todos.list('user-1', 'active'))

    ;(useQuery as jest.Mock).mockClear()
    useTodosQuery('user-1', 'completed')
    const [optionsCompleted] = (useQuery as jest.Mock).mock.calls[0]
    expect(optionsCompleted.queryKey).toEqual(queryKeys.todos.list('user-1', 'completed'))
  })

  it('disables query when uid is empty', () => {
    useTodosQuery('')

    const [options] = (useQuery as jest.Mock).mock.calls[0]
    expect(options.enabled).toBe(false)
  })

  it('uses query key with selectedTagId when selectedTagId is passed', () => {
    useTodosQuery('user-1', 'all', 'tag-1')
    const [options] = (useQuery as jest.Mock).mock.calls[0]
    expect(options.queryKey).toEqual(queryKeys.todos.list('user-1', 'all', 'tag-1'))

    ;(useQuery as jest.Mock).mockClear()
    useTodosQuery('user-1', 'active', null)
    const [optionsNull] = (useQuery as jest.Mock).mock.calls[0]
    expect(optionsNull.queryKey).toEqual(queryKeys.todos.list('user-1', 'active', null))
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
      queryKey: queryKeys.todos.list('user-1', 'all'),
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

  it('loading path starts with isPending true', async () => {
    const client = createTestQueryClient()
    let resolveFn!: (value: unknown) => void
    ;(api.getTodos as jest.Mock).mockReturnValue(
      new Promise(resolve => {
        resolveFn = resolve
      }),
    )

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.todos.list('user-1', 'all'),
      queryFn: () => api.getTodos('user-1'),
      retry: false,
    })
    const snapshots: Array<{ isPending: boolean }> = []

    const unsubscribe = observer.subscribe((result) => {
      snapshots.push({ isPending: result.isPending })
    })

    // While the promise is unresolved the first snapshot should be pending
    expect(snapshots.some((s) => s.isPending)).toBe(true)

    // Resolve so the observer doesn't leak
    resolveFn([])
    await observer.refetch()

    unsubscribe()
    client.clear()
  })

  it('error path transitions to error state', async () => {
    const client = createTestQueryClient()
    ;(api.getTodos as jest.Mock).mockRejectedValue(new Error('Network error'))

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.todos.list('user-1', 'all'),
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

const baseTodo = {
  uid: 'user-1',
  createdAt: '',
  updatedAt: '',
} as const

describe('useTodosQuery filter and sort', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('filter "all" returns all todos sorted by dueDate', async () => {
    const client = createTestQueryClient()
    const mockTodos = [
      { ...baseTodo, id: '1', title: 'A', completed: false, dueDate: '2025-01-02' },
      { ...baseTodo, id: '2', title: 'B', completed: true, dueDate: '2025-01-01' },
      { ...baseTodo, id: '3', title: 'C', completed: false, dueDate: '2025-01-03' },
    ]
    ;(api.getTodos as jest.Mock).mockResolvedValue(mockTodos)

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.todos.list('user-1', 'all'),
      queryFn: () => api.getTodos('user-1'),
      select: (data: Todo[]) => filterAndSortTodos(data, 'all'),
      retry: false,
    })
    let selectedData: Todo[] | undefined
    const unsubscribe = observer.subscribe((result) => {
      if (result.isSuccess && result.data !== undefined) selectedData = result.data
    })
    await observer.refetch()

    expect(selectedData).toHaveLength(3)
    expect(selectedData!.map(t => t.id)).toEqual(['2', '1', '3']) // sorted by dueDate: 01-01, 01-02, 01-03
    unsubscribe()
    client.clear()
  })

  it('filter "active" returns only non-completed todos sorted by dueDate', async () => {
    const client = createTestQueryClient()
    const mockTodos = [
      { ...baseTodo, id: '1', title: 'A', completed: false, dueDate: '2025-01-02' },
      { ...baseTodo, id: '2', title: 'B', completed: true, dueDate: '2025-01-01' },
      { ...baseTodo, id: '3', title: 'C', completed: false, dueDate: '2025-01-03' },
    ]
    ;(api.getTodos as jest.Mock).mockResolvedValue(mockTodos)

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.todos.list('user-1', 'active'),
      queryFn: () => api.getTodos('user-1'),
      select: (data: Todo[]) => filterAndSortTodos(data, 'active'),
      retry: false,
    })
    let selectedData: Todo[] | undefined
    const unsubscribe = observer.subscribe((result) => {
      if (result.isSuccess && result.data !== undefined) selectedData = result.data
    })
    await observer.refetch()

    expect(selectedData).toHaveLength(2)
    expect(selectedData!.every(t => !t.completed)).toBe(true)
    expect(selectedData!.map(t => t.id)).toEqual(['1', '3']) // dueDate order 01-02, 01-03
    unsubscribe()
    client.clear()
  })

  it('filter "completed" returns only completed todos sorted by dueDate', async () => {
    const client = createTestQueryClient()
    const mockTodos = [
      { ...baseTodo, id: '1', title: 'A', completed: false, dueDate: '2025-01-02' },
      { ...baseTodo, id: '2', title: 'B', completed: true, dueDate: '2025-01-01' },
      { ...baseTodo, id: '3', title: 'C', completed: true, dueDate: '2025-01-03' },
    ]
    ;(api.getTodos as jest.Mock).mockResolvedValue(mockTodos)

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.todos.list('user-1', 'completed'),
      queryFn: () => api.getTodos('user-1'),
      select: (data: Todo[]) => filterAndSortTodos(data, 'completed'),
      retry: false,
    })
    let selectedData: Todo[] | undefined
    const unsubscribe = observer.subscribe((result) => {
      if (result.isSuccess && result.data !== undefined) selectedData = result.data
    })
    await observer.refetch()

    expect(selectedData).toHaveLength(2)
    expect(selectedData!.every(t => t.completed)).toBe(true)
    expect(selectedData!.map(t => t.id)).toEqual(['2', '3']) // dueDate 01-01, 01-03
    unsubscribe()
    client.clear()
  })

  it('when selectedTagId is set, returned data only includes todos with that tagId in tagIds', async () => {
    const client = createTestQueryClient()
    const tagId = 'tag-1'
    const mockTodos = [
      { ...baseTodo, id: '1', title: 'A', completed: false, dueDate: '2025-01-01', tagIds: ['tag-1', 'tag-2'] },
      { ...baseTodo, id: '2', title: 'B', completed: false, dueDate: '2025-01-02', tagIds: ['tag-2'] },
      { ...baseTodo, id: '3', title: 'C', completed: false, dueDate: '2025-01-03', tagIds: ['tag-1'] },
      { ...baseTodo, id: '4', title: 'D', completed: false, dueDate: '2025-01-04' }, // no tagIds
    ]
    ;(api.getTodos as jest.Mock).mockResolvedValue(mockTodos)

    const observer = new QueryObserver(client, {
      queryKey: queryKeys.todos.list('user-1', 'all', tagId),
      queryFn: () => api.getTodos('user-1'),
      select: (data: Todo[]) => {
        const filtered = filterAndSortTodos(data, 'all')
        return filtered.filter(t => (t.tagIds ?? []).includes(tagId))
      },
      retry: false,
    })
    let selectedData: Todo[] | undefined
    const unsubscribe = observer.subscribe((result) => {
      if (result.isSuccess && result.data !== undefined) selectedData = result.data
    })
    await observer.refetch()

    expect(selectedData).toHaveLength(2)
    expect(selectedData!.map(t => t.id)).toEqual(['1', '3'])
    expect(selectedData!.every(t => (t.tagIds ?? []).includes(tagId))).toBe(true)
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

  it('invalidates todos.lists() on update success', async () => {
    const invalidateQueries = jest.fn()
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })

    useUpdateTodoMutation()

    expect(useMutation).toHaveBeenCalledTimes(1)
    const [options] = (useMutation as jest.Mock).mock.calls[0]
    await options.mutationFn({ id: 'todo-1', title: 'Updated' })
    expect(api.updateTodo).toHaveBeenCalledWith('todo-1', { title: 'Updated' })

    await options.onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.todos.lists() })
  })

  it('invalidates todos.lists() on delete success', async () => {
    const invalidateQueries = jest.fn()
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })

    useDeleteTodoMutation()

    expect(useMutation).toHaveBeenCalledTimes(1)
    const [options] = (useMutation as jest.Mock).mock.calls[0]
    await options.mutationFn('todo-1')
    expect(api.deleteTodo).toHaveBeenCalledWith('todo-1')

    await options.onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.todos.lists() })
  })
})
