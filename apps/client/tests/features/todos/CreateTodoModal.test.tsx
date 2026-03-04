import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Alert } from 'react-native'
import { CreateTodoModal } from '@/features/todos/CreateTodoModal'
import { queryKeys } from '@/data/queryKeys'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useUpdateTodoMutation } from '@/data/hooks/useUpdateTodoMutation'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { useCreateTagMutation } from '@/data/hooks/useCreateTagMutation'

jest.mock('@/data/hooks/useCreateTodoMutation')
jest.mock('@/data/hooks/useUpdateTodoMutation')
jest.mock('@/data/hooks/useTagsQuery')
jest.mock('@/data/hooks/useCreateTagMutation')

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockCreateMutateAsync = jest.fn()
const mockUpdateMutateAsync = jest.fn()
const mockCreateTagMutateAsync = jest.fn()

jest.spyOn(Alert, 'alert').mockImplementation(() => {})

describe('CreateTodoModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useCreateTodoMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    })
    ;(useUpdateTodoMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    })
    ;(useTagsQuery as jest.Mock).mockReturnValue({
      data: [],
    })
    ;(useCreateTagMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockCreateTagMutateAsync,
      isPending: false,
    })
    useAuthStore.setState({ uid: 'test-uid' })
    useUIStore.setState({
      isCreateModalOpen: true,
      selectedTodoId: null,
      filter: 'all',
    })
  })

  it('renders modal when open with title input and save button', () => {
    render(<CreateTodoModal />, { wrapper })
    expect(screen.getByTestId('create-todo-input')).toBeOnTheScreen()
    expect(screen.getByTestId('create-todo-save')).toBeOnTheScreen()
  })

  it('shows title error when save with empty title', async () => {
    render(<CreateTodoModal />, { wrapper })
    fireEvent.press(screen.getByTestId('create-todo-save'))
    expect(await screen.findByTestId('create-todo-title-error')).toBeOnTheScreen()
    expect(mockCreateMutateAsync).not.toHaveBeenCalled()
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled()
  })

  it('calls create mutation and closes on save success', async () => {
    mockCreateMutateAsync.mockResolvedValue(undefined)
    const closeModal = jest.fn()
    useUIStore.setState({ closeCreateModal: closeModal })

    render(<CreateTodoModal />, { wrapper })
    fireEvent.changeText(screen.getByTestId('create-todo-input'), 'New todo')
    fireEvent.press(screen.getByTestId('create-todo-save'))

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        title: 'New todo',
        description: undefined,
        dueDate: undefined,
        tagIds: [],
      })
    })
    expect(closeModal).toHaveBeenCalled()
  })

  it('pre-fills form when editing (cache key with selectedTagId null)', () => {
    const queryClient = new QueryClient()
    const todo = {
      id: 'todo-1',
      uid: 'test-uid',
      title: 'Edit me',
      description: 'Notes',
      completed: false,
      dueDate: '2026-03-20',
      createdAt: '',
      updatedAt: '',
      tagIds: ['tag-a'],
    }
    ;(useTagsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'tag-a',
          name: 'Work',
          emoji: '🧰',
          colorToken: 'tagTeal',
          uid: 'test-uid',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'tag-b',
          name: 'Personal',
          emoji: '🏠',
          colorToken: 'tagBlue',
          uid: 'test-uid',
          createdAt: '',
          updatedAt: '',
        },
      ],
    })
    queryClient.setQueryData(queryKeys.todos.list('test-uid', 'all', null), [todo])
    useUIStore.setState({ selectedTodoId: 'todo-1', filter: 'all' })

    render(
      <QueryClientProvider client={queryClient}>
        <CreateTodoModal />
      </QueryClientProvider>,
    )

    expect(screen.getByTestId('create-todo-input')).toHaveProp('value', 'Edit me')
    expect(screen.getByTestId('create-todo-description').props.value).toBe('Notes')
    expect(screen.getByTestId('create-todo-due-date')).toHaveProp('value', '2026-03-20')
    expect(screen.getByTestId('create-todo-tag-tag-a')).toHaveProp('accessibilityState', { selected: true })
    expect(screen.getByTestId('create-todo-tag-tag-b')).toHaveProp('accessibilityState', { selected: false })
  })

  it('calls update mutation when editing existing todo', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKeys.todos.list('test-uid', 'all'), [
      {
        id: 'todo-1',
        uid: 'test-uid',
        title: 'Existing',
        description: 'desc',
        completed: false,
        dueDate: '2026-03-15T00:00:00.000Z',
        createdAt: '',
        updatedAt: '',
        tagIds: ['tag-a'],
      },
    ])
    ;(useTagsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'tag-a',
          name: 'Work',
          emoji: '🧰',
          colorToken: 'tagTeal',
          uid: 'test-uid',
          createdAt: '',
          updatedAt: '',
        },
      ],
    })
    mockUpdateMutateAsync.mockResolvedValue(undefined)
    const setSelectedTodoId = jest.fn()
    const closeModal = jest.fn()
    useUIStore.setState({
      selectedTodoId: 'todo-1',
      filter: 'all',
      setSelectedTodoId,
      closeCreateModal: closeModal,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <CreateTodoModal />
      </QueryClientProvider>,
    )

    expect(screen.getByTestId('create-todo-input')).toHaveProp('value', 'Existing')
    fireEvent.changeText(screen.getByTestId('create-todo-input'), 'Updated')
    fireEvent.press(screen.getByTestId('create-todo-save'))

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'todo-1',
          title: 'Updated',
          description: 'desc',
          dueDate: '2026-03-15',
          tagIds: ['tag-a'],
        }),
      )
    })
    expect(closeModal).toHaveBeenCalled()
  })

  it('does not surface a local alert when mutation fails', async () => {
    mockCreateMutateAsync.mockRejectedValue(new Error('API error'))

    render(<CreateTodoModal />, { wrapper })
    fireEvent.changeText(screen.getByTestId('create-todo-input'), 'New todo')
    fireEvent.press(screen.getByTestId('create-todo-save'))

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        title: 'New todo',
        description: undefined,
        dueDate: undefined,
        tagIds: [],
      })
    })
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('clears title error when user types after validation error', async () => {
    render(<CreateTodoModal />, { wrapper })
    fireEvent.press(screen.getByTestId('create-todo-save'))
    expect(await screen.findByTestId('create-todo-title-error')).toBeOnTheScreen()

    fireEvent.changeText(screen.getByTestId('create-todo-input'), 'a')
    expect(screen.queryByTestId('create-todo-title-error')).toBeNull()
  })

  it('closes modal on cancel button press', () => {
    const closeModal = jest.fn()
    useUIStore.setState({ closeCreateModal: closeModal })

    render(<CreateTodoModal />, { wrapper })
    fireEvent.press(screen.getByTestId('create-todo-cancel'))

    expect(closeModal).toHaveBeenCalled()
  })

  it('shows "New tag" action when tags already exist', () => {
    ;(useTagsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'tag-a',
          name: 'Work',
          emoji: '🧰',
          colorToken: 'tagTeal',
          uid: 'test-uid',
          createdAt: '',
          updatedAt: '',
        },
      ],
    })
    render(<CreateTodoModal />, { wrapper })
    expect(screen.getByTestId('create-todo-new-tag')).toBeOnTheScreen()
    expect(screen.queryByTestId('create-todo-empty-tags')).toBeNull()
    expect(screen.queryByTestId('create-todo-new-tag-input')).toBeNull()
  })

  it('shows tag chips when tags exist from useTagsQuery', () => {
    ;(useTagsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'tag-a',
          name: 'Work',
          emoji: '🧰',
          colorToken: 'tagTeal',
          uid: 'test-uid',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'tag-b',
          name: 'Personal',
          emoji: '🏠',
          colorToken: 'tagBlue',
          uid: 'test-uid',
          createdAt: '',
          updatedAt: '',
        },
      ],
    })
    render(<CreateTodoModal />, { wrapper })
    expect(screen.getByTestId('create-todo-tag-tag-a')).toBeOnTheScreen()
    expect(screen.getByText('🧰 Work')).toBeOnTheScreen()
    expect(screen.getByTestId('create-todo-tag-tag-b')).toBeOnTheScreen()
    expect(screen.getByText('🏠 Personal')).toBeOnTheScreen()
    expect(screen.queryByTestId('create-todo-new-tag-input')).toBeNull()
  })

  it('shows empty-state action when there are no tags', () => {
    ;(useTagsQuery as jest.Mock).mockReturnValue({ data: [] })
    render(<CreateTodoModal />, { wrapper })
    expect(screen.getByTestId('create-todo-empty-tags')).toBeOnTheScreen()
    expect(screen.getByTestId('create-todo-create-first-tag')).toBeOnTheScreen()
    expect(screen.queryByTestId('create-todo-new-tag')).toBeNull()
  })

  it('removes a selected tag when pressed again in edit mode', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKeys.todos.list('test-uid', 'all', null), [
      {
        id: 'todo-1',
        uid: 'test-uid',
        title: 'Existing',
        completed: false,
        createdAt: '',
        updatedAt: '',
        tagIds: ['tag-a'],
      },
    ])
    ;(useTagsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'tag-a',
          name: 'Work',
          emoji: '🧰',
          colorToken: 'tagTeal',
          uid: 'test-uid',
          createdAt: '',
          updatedAt: '',
        },
      ],
    })
    useUIStore.setState({ selectedTodoId: 'todo-1', filter: 'all' })

    render(
      <QueryClientProvider client={queryClient}>
        <CreateTodoModal />
      </QueryClientProvider>,
    )

    expect(screen.getByTestId('create-todo-tag-tag-a')).toHaveProp('accessibilityState', {
      selected: true,
    })
    fireEvent.press(screen.getByTestId('create-todo-tag-tag-a'))
    expect(screen.getByTestId('create-todo-tag-tag-a')).toHaveProp('accessibilityState', {
      selected: false,
    })
  })

  it('creates a tag from the child modal and auto-selects it', async () => {
    mockCreateTagMutateAsync.mockResolvedValue({
      id: 'tag-new',
      name: 'Errands',
      emoji: '🛒',
      colorToken: 'tagGreen',
      uid: 'test-uid',
      createdAt: '',
      updatedAt: '',
    })
    ;(useTagsQuery as jest.Mock).mockReturnValue({ data: [] })

    render(<CreateTodoModal />, { wrapper })

    fireEvent.press(screen.getByTestId('create-todo-create-first-tag'))
    fireEvent.changeText(screen.getByTestId('tag-form-name-input'), 'Errands')
    fireEvent.press(screen.getByTestId('tag-form-emoji-🛒'))
    fireEvent.press(screen.getByTestId('tag-form-color-tagGreen'))
    fireEvent.press(screen.getByTestId('tag-form-save'))

    await waitFor(() => {
      expect(mockCreateTagMutateAsync).toHaveBeenCalledWith({
        name: 'Errands',
        emoji: '🛒',
        colorToken: 'tagGreen',
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('create-todo-tag-tag-new')).toHaveProp('accessibilityState', {
        selected: true,
      })
    })
  })
})
