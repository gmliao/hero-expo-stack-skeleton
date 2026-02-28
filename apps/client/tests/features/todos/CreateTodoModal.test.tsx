import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateTodoModal } from '@/features/todos/CreateTodoModal'
import { queryKeys } from '@/data/queryKeys'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useUpdateTodoMutation } from '@/data/hooks/useUpdateTodoMutation'

jest.mock('@/data/hooks/useCreateTodoMutation')
jest.mock('@/data/hooks/useUpdateTodoMutation')

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
      })
    })
    expect(closeModal).toHaveBeenCalled()
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
      },
    ])
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
      }),
    )
    })
    expect(closeModal).toHaveBeenCalled()
  })

  it('shows save error when mutation fails', async () => {
    mockCreateMutateAsync.mockRejectedValue(new Error('API error'))

    render(<CreateTodoModal />, { wrapper })
    fireEvent.changeText(screen.getByTestId('create-todo-input'), 'New todo')
    fireEvent.press(screen.getByTestId('create-todo-save'))

    expect(await screen.findByTestId('create-todo-save-error')).toBeOnTheScreen()
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
})
