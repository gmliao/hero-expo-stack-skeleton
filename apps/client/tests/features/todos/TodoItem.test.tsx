import { fireEvent, render, screen } from '@testing-library/react-native'
import { TodoItem } from '@/features/todos/TodoItem'

const mockTodo = {
  id: 'todo-1',
  title: 'Buy milk',
  completed: false,
  dueDate: '2025-03-01',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  userId: 'user-1',
}

describe('TodoItem', () => {
  it('renders todo title and toggle', () => {
    const onToggle = jest.fn()
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )
    expect(screen.getByText('Buy milk')).toBeOnTheScreen()
    expect(screen.getByTestId('todo-item-todo-1')).toBeOnTheScreen()
    expect(screen.getByTestId('todo-toggle-todo-1')).toBeOnTheScreen()
  })

  it('calls onToggle when toggle is pressed', () => {
    const onToggle = jest.fn()
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={onToggle}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    )
    fireEvent.press(screen.getByTestId('todo-toggle-todo-1'))
    expect(onToggle).toHaveBeenCalledWith('todo-1')
  })

  it('calls onEdit when edit is pressed', () => {
    const onEdit = jest.fn()
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={jest.fn()}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />,
    )
    fireEvent.press(screen.getByTestId('todo-edit-todo-1'))
    expect(onEdit).toHaveBeenCalledWith(mockTodo)
  })

  it('calls onDelete when delete is pressed', () => {
    const onDelete = jest.fn()
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={jest.fn()}
        onEdit={jest.fn()}
        onDelete={onDelete}
      />,
    )
    fireEvent.press(screen.getByTestId('todo-delete-todo-1'))
    expect(onDelete).toHaveBeenCalledWith(mockTodo)
  })

  it('renders tag badges when todo has tagIds and tags are provided', () => {
    const todoWithTags = {
      ...mockTodo,
      id: 'todo-with-tags',
      tagIds: ['tag-1', 'tag-2'],
    }
    const tags = [
      { id: 'tag-1', name: 'Work', uid: 'user-1', createdAt: '', updatedAt: '' },
      { id: 'tag-2', name: 'Urgent', uid: 'user-1', createdAt: '', updatedAt: '' },
    ]
    render(
      <TodoItem
        todo={todoWithTags}
        tags={tags}
        onToggle={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    )
    expect(screen.getByText('Work')).toBeOnTheScreen()
    expect(screen.getByText('Urgent')).toBeOnTheScreen()
  })
})
