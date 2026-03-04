import { fireEvent, render, screen } from '@testing-library/react-native'
import { TodosList } from '@/features/todos/TodosList'
import type { Tag } from '@shared/types/api'

const mockTodos = [
  {
    id: '1',
    title: 'First',
    completed: false,
    dueDate: '',
    createdAt: '',
    updatedAt: '',
    uid: 'u1',
  },
]

describe('TodosList', () => {
  it('renders todo items when todos provided', () => {
    render(
      <TodosList
        todos={mockTodos}
        onToggle={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onCreatePress={jest.fn()}
      />,
    )
    expect(screen.getByTestId('todo-item-1')).toBeOnTheScreen()
    expect(screen.getByText('First')).toBeOnTheScreen()
  })

  it('renders empty state when todos is empty', () => {
    render(
      <TodosList
        todos={[]}
        onToggle={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onCreatePress={jest.fn()}
      />,
    )
    expect(screen.getByTestId('todos-empty')).toBeOnTheScreen()
    expect(screen.getByTestId('create-todo-button-empty')).toBeOnTheScreen()
  })

  it('calls onCreatePress when empty state button pressed', () => {
    const onCreatePress = jest.fn()
    render(
      <TodosList
        todos={[]}
        onToggle={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onCreatePress={onCreatePress}
      />,
    )
    fireEvent.press(screen.getByTestId('create-todo-button-empty'))
    expect(onCreatePress).toHaveBeenCalled()
  })

  it('calls onToggle when todo toggle pressed', () => {
    const onToggle = jest.fn()
    render(
      <TodosList
        todos={mockTodos}
        onToggle={onToggle}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onCreatePress={jest.fn()}
      />,
    )
    fireEvent.press(screen.getByTestId('todo-toggle-1'))
    expect(onToggle).toHaveBeenCalledWith('1')
  })

  it('passes todo tag presses to the shared filter handler', () => {
    const onTagPress = jest.fn()
    const tags: Tag[] = [
      {
        id: 'tag-1',
        name: 'Work',
        emoji: '🧰',
        colorToken: 'tagTeal',
        uid: 'u1',
        createdAt: '',
        updatedAt: '',
      },
    ]

    render(
      <TodosList
        todos={[{ ...mockTodos[0], tagIds: ['tag-1'] }]}
        tags={tags}
        selectedTagId={null}
        onTagPress={onTagPress}
        onToggle={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onCreatePress={jest.fn()}
      />,
    )

    fireEvent.press(screen.getByTestId('todo-tag-1-tag-1'))
    expect(onTagPress).toHaveBeenCalledWith('tag-1')
  })
})
