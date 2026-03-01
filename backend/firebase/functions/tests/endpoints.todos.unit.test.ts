import { createTodoEndpoint } from '../src/endpoints/todos/createTodo.endpoint'
import { listTodosEndpoint } from '../src/endpoints/todos/listTodos.endpoint'
import { updateTodoEndpoint } from '../src/endpoints/todos/updateTodo.endpoint'
import { toggleTodoEndpoint } from '../src/endpoints/todos/toggleTodo.endpoint'
import { deleteTodoEndpoint } from '../src/endpoints/todos/deleteTodo.endpoint'
import { AppError } from '../src/http/errors'
import type { Deps, RequestContext } from '../src/http/endpoint'
import { createMockTodosService } from './mocks/todos.service.mock'

function mockCtx(uid = 'test-uid'): RequestContext {
  return {
    requestId: 'req-1',
    uid,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    now: new Date(),
  }
}

function mockDeps(overrides: Partial<ReturnType<typeof createMockTodosService>> = {}): Deps {
  return {
    services: {
      todos: createMockTodosService(overrides),
    },
    auth: { verifyIdToken: async () => ({ uid: 'test-uid' }) },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  }
}

describe('Todo endpoints (unit)', () => {
  describe('createTodo', () => {
    it('delegates to services.todos.createTodo with uid and body', async () => {
      const deps = mockDeps()
      const result = await createTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: { title: 'New', description: '', dueDate: undefined }, query: {}, params: {} },
      })
      expect(deps.services.todos.createTodo).toHaveBeenCalledWith('test-uid', expect.objectContaining({ title: 'New' }))
      expect(result).toBeDefined()
    })
  })

  describe('listTodos', () => {
    it('delegates to services.todos.listTodos with uid', async () => {
      const deps = mockDeps()
      await listTodosEndpoint.execute({ deps, ctx: mockCtx(), input: { body: {}, query: {}, params: {} } })
      expect(deps.services.todos.listTodos).toHaveBeenCalledWith('test-uid')
    })
  })

  describe('updateTodo', () => {
    it('delegates to services.todos.updateTodo with uid, id, body', async () => {
      const deps = mockDeps()
      await updateTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: { title: 'Updated' }, query: {}, params: { id: 't1' } },
      })
      expect(deps.services.todos.updateTodo).toHaveBeenCalledWith('test-uid', 't1', expect.objectContaining({ title: 'Updated' }))
    })

    it('propagates AppError from service', async () => {
      const deps = mockDeps({
        updateTodo: jest.fn().mockRejectedValue(new AppError('NOT_FOUND', 'Todo not found')),
      })
      await expect(
        updateTodoEndpoint.execute({ deps, ctx: mockCtx(), input: { body: { title: 'x' }, query: {}, params: { id: 'nope' } } })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('toggleTodo', () => {
    it('delegates to services.todos.toggleTodo with uid, id', async () => {
      const deps = mockDeps()
      await toggleTodoEndpoint.execute({ deps, ctx: mockCtx(), input: { body: {}, query: {}, params: { id: 't1' } } })
      expect(deps.services.todos.toggleTodo).toHaveBeenCalledWith('test-uid', 't1')
    })

    it('propagates AppError from service', async () => {
      const deps = mockDeps({
        toggleTodo: jest.fn().mockRejectedValue(new AppError('FORBIDDEN', 'Forbidden')),
      })
      await expect(
        toggleTodoEndpoint.execute({ deps, ctx: mockCtx(), input: { body: {}, query: {}, params: { id: 't1' } } })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe('deleteTodo', () => {
    it('delegates to services.todos.deleteTodo and returns null', async () => {
      const deps = mockDeps()
      const result = await deleteTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: { id: 't1' } },
      })
      expect(deps.services.todos.deleteTodo).toHaveBeenCalledWith('test-uid', 't1')
      expect(result).toBeNull()
    })
  })
})
