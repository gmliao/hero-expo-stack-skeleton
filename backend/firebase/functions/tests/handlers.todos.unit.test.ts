/**
 * Unit tests for todo handlers. No emulator needed — inject mock ITodosRepository.
 */
import { createTodoHandlers } from '../src/handlers/todos'
import { createMockTodosRepository } from './mocks/todos.repository.mock'
import type { Todo } from '../src/types/api'

describe('Todo handlers (unit)', () => {
  function mockReq(overrides: {
    uid?: string
    params?: Record<string, string>
    body?: Record<string, unknown>
  } = {}) {
    return {
      uid: overrides.uid ?? 'test-uid',
      params: overrides.params ?? {},
      body: overrides.body ?? {},
    } as any
  }

  function mockRes() {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }
    return res
  }

  describe('getTodos', () => {
    it('returns todos for user sorted by dueDate', async () => {
      const todos: Todo[] = [
        {
          id: '1',
          uid: 'test-uid',
          title: 'A',
          completed: false,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: '2',
          uid: 'test-uid',
          title: 'B',
          dueDate: '2026-01-01',
          completed: false,
          createdAt: '',
          updatedAt: '',
        },
      ]
      const repo = createMockTodosRepository({ todos })
      const handlers = createTodoHandlers(repo)
      const req = mockReq()
      const res = mockRes()

      await handlers.getTodos(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '2', dueDate: '2026-01-01' }),
          expect.objectContaining({ id: '1' }),
        ]),
      )
    })
  })

  describe('createTodo', () => {
    it('returns 400 without title', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ body: {} })
      const res = mockRes()

      await handlers.createTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.any(String) }),
      )
      expect(repo.todos).toHaveLength(0)
    })

    it('creates todo and returns 201', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({
        body: { title: 'New Todo', description: 'desc', dueDate: '2026-03-15' },
      })
      const res = mockRes()

      await handlers.createTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'test-uid',
          title: 'New Todo',
          description: 'desc',
          dueDate: '2026-03-15',
          completed: false,
        }),
      )
      expect(repo.todos).toHaveLength(1)
    })
  })

  describe('updateTodo', () => {
    it('returns 404 for non-existent id', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 'non-existent' }, body: { title: 'x' } })
      const res = mockRes()

      await handlers.updateTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ error: 'Todo not found' })
    })

    it('returns 403 when uid does not own todo', async () => {
      const repo = createMockTodosRepository({
        todos: [
          {
            id: 't1',
            uid: 'other-uid',
            title: 'Other',
            completed: false,
            createdAt: '',
            updatedAt: '',
          },
        ],
      })
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 't1' }, body: { title: 'Hacked' } })
      const res = mockRes()

      await handlers.updateTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
    })

    it('updates todo and returns it', async () => {
      const repo = createMockTodosRepository({
        todos: [
          {
            id: 't1',
            uid: 'test-uid',
            title: 'Original',
            completed: false,
            createdAt: '',
            updatedAt: '',
          },
        ],
      })
      const handlers = createTodoHandlers(repo)
      const req = mockReq({
        params: { id: 't1' },
        body: { title: 'Updated', completed: true },
      })
      const res = mockRes()

      await handlers.updateTodo(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 't1',
          title: 'Updated',
          completed: true,
        }),
      )
    })
  })

  describe('deleteTodo', () => {
    it('returns 404 for non-existent id', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 'non-existent' } })
      const res = mockRes()

      await handlers.deleteTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('returns 403 when uid does not own todo', async () => {
      const repo = createMockTodosRepository({
        todos: [
          {
            id: 't1',
            uid: 'other-uid',
            title: 'Other',
            completed: false,
            createdAt: '',
            updatedAt: '',
          },
        ],
      })
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 't1' } })
      const res = mockRes()

      await handlers.deleteTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('deletes own todo and returns 204', async () => {
      const repo = createMockTodosRepository({
        todos: [
          {
            id: 't1',
            uid: 'test-uid',
            title: 'To Delete',
            completed: false,
            createdAt: '',
            updatedAt: '',
          },
        ],
      })
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 't1' } })
      const res = mockRes()

      await handlers.deleteTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(204)
      expect(repo.todos).toHaveLength(0)
    })
  })

  describe('toggleTodo', () => {
    it('returns 404 for non-existent id', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 'non-existent' } })
      const res = mockRes()

      await handlers.toggleTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('returns 403 when uid does not own todo', async () => {
      const repo = createMockTodosRepository({
        todos: [
          {
            id: 't1',
            uid: 'other-uid',
            title: 'Other',
            completed: false,
            createdAt: '',
            updatedAt: '',
          },
        ],
      })
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 't1' } })
      const res = mockRes()

      await handlers.toggleTodo(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('toggles completed and returns todo', async () => {
      const repo = createMockTodosRepository({
        todos: [
          {
            id: 't1',
            uid: 'test-uid',
            title: 'Toggle Me',
            completed: false,
            createdAt: '',
            updatedAt: '',
          },
        ],
      })
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 't1' } })
      const res = mockRes()

      await handlers.toggleTodo(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 't1',
          completed: true,
        }),
      )
    })
  })
})
