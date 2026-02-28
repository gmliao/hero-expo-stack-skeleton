import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TodosScreen from '../../../app/(app)/index'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

jest.mock('@/data/hooks/useTodosQuery', () => ({
  useTodosQuery: () => ({
    data: [],
    isPending: false,
    isError: false,
  }),
}))
jest.mock('@/data/hooks/useToggleTodoMutation', () => ({
  useToggleTodoMutation: () => ({ mutate: jest.fn() }),
}))
jest.mock('@/data/hooks/useDeleteTodoMutation', () => ({
  useDeleteTodoMutation: () => ({ mutate: jest.fn() }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('TodosScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ uid: 'user-1' })
    useUIStore.setState({ filter: 'all' })
  })

  it('renders header and empty list when no todos', () => {
    render(<TodosScreen />, { wrapper })
    expect(screen.getByTestId('todos-title')).toBeOnTheScreen()
    expect(screen.getByTestId('create-todo-button')).toBeOnTheScreen()
    expect(screen.getByTestId('todos-empty')).toBeOnTheScreen()
  })
})
