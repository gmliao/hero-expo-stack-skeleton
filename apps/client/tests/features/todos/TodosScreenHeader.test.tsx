import { fireEvent, render, screen } from '@testing-library/react-native'
import { router } from 'expo-router'
import { TodosScreenHeader } from '@/features/todos/TodosScreenHeader'

describe('TodosScreenHeader', () => {
  it('renders title and create button', () => {
    const onCreatePress = jest.fn()
    render(<TodosScreenHeader onCreatePress={onCreatePress} />)
    expect(screen.getByTestId('todos-title')).toBeOnTheScreen()
    expect(screen.getByText('todos.title')).toBeOnTheScreen()
    expect(screen.getByTestId('create-todo-button')).toBeOnTheScreen()
    expect(screen.getByText('todos.create')).toBeOnTheScreen()
    expect(screen.getByTestId('todos-options-link')).toBeOnTheScreen()
  })

  it('calls onCreatePress when create button pressed', () => {
    const onCreatePress = jest.fn()
    render(<TodosScreenHeader onCreatePress={onCreatePress} />)
    fireEvent.press(screen.getByTestId('create-todo-button'))
    expect(onCreatePress).toHaveBeenCalled()
  })

  it('navigates to options when options link pressed', () => {
    render(<TodosScreenHeader onCreatePress={jest.fn()} />)
    fireEvent.press(screen.getByTestId('todos-options-link'))
    expect(router.push).toHaveBeenCalledWith('/(app)/options')
  })
})
