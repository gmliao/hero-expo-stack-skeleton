import type { ITodosService } from '../../src/modules/todos/todos.types'
import type { Todo } from '../../src/types/api'

export function createMockTodosService(overrides: Partial<ITodosService> = {}): ITodosService {
  return {
    listTodos: jest.fn().mockResolvedValue([]),
    createTodo: jest.fn().mockResolvedValue({
      id: 'mock-id',
      uid: 'test-uid',
      title: 'Mock Todo',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Todo),
    updateTodo: jest.fn().mockResolvedValue({
      id: 'mock-id',
      uid: 'test-uid',
      title: 'Updated',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Todo),
    toggleTodo: jest.fn().mockResolvedValue({
      id: 'mock-id',
      uid: 'test-uid',
      title: 'Mock Todo',
      completed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Todo),
    deleteTodo: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}
