import { TodosService } from '../src/services/todos.service'
import { AppError } from '../src/http/errors'
import { createMockTodosRepository } from './mocks/todos.repository.mock'
import type { Todo } from '../src/types/api'

const baseTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 't1',
  uid: 'user-1',
  title: 'Test',
  completed: false,
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

describe('TodosService (unit)', () => {
  describe('listTodos', () => {
    it('returns todos for the user', async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo()] })
      const svc = new TodosService(repo)
      const result = await svc.listTodos('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe('user-1')
    })
  })

  describe('createTodo', () => {
    it('creates and returns todo owned by uid', async () => {
      const repo = createMockTodosRepository()
      const svc = new TodosService(repo)
      const result = await svc.createTodo('user-1', { title: 'New' })
      expect(result.uid).toBe('user-1')
      expect(result.title).toBe('New')
    })
  })

  describe('updateTodo', () => {
    it('throws NOT_FOUND when todo does not exist', async () => {
      const repo = createMockTodosRepository()
      const svc = new TodosService(repo)
      await expect(svc.updateTodo('user-1', 'nope', { title: 'x' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('throws FORBIDDEN when uid does not own todo', async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo({ uid: 'other' })] })
      const svc = new TodosService(repo)
      await expect(svc.updateTodo('user-1', 't1', { title: 'x' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('updates and returns todo when uid matches', async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo()] })
      const svc = new TodosService(repo)
      const result = await svc.updateTodo('user-1', 't1', { title: 'Updated' })
      expect(result.title).toBe('Updated')
    })
  })

  describe('toggleTodo', () => {
    it('throws NOT_FOUND when todo does not exist', async () => {
      const repo = createMockTodosRepository()
      const svc = new TodosService(repo)
      await expect(svc.toggleTodo('user-1', 'nope')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('throws FORBIDDEN when uid does not own todo', async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo({ uid: 'other' })] })
      const svc = new TodosService(repo)
      await expect(svc.toggleTodo('user-1', 't1')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('toggles completed and returns todo', async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo({ completed: false })] })
      const svc = new TodosService(repo)
      const result = await svc.toggleTodo('user-1', 't1')
      expect(result.completed).toBe(true)
    })
  })

  describe('deleteTodo', () => {
    it('throws NOT_FOUND when todo does not exist', async () => {
      const repo = createMockTodosRepository()
      const svc = new TodosService(repo)
      await expect(svc.deleteTodo('user-1', 'nope')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('throws FORBIDDEN when uid does not own todo', async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo({ uid: 'other' })] })
      const svc = new TodosService(repo)
      await expect(svc.deleteTodo('user-1', 't1')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('deletes successfully when uid matches', async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo()] })
      const svc = new TodosService(repo)
      await expect(svc.deleteTodo('user-1', 't1')).resolves.toBeUndefined()
    })
  })
})
