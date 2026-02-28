/**
 * Unit tests for todo handlers. No emulator needed — inject mock ITodosRepository.
 */
import type { Response } from 'express'
import { createTodoHandlers } from '../src/handlers/todos'
import { NotFoundError, ForbiddenError } from '../src/lib/errors'
import type { ValidatedBodyRequest } from '../src/lib/validate'
import type { AuthenticatedRequest } from '../src/middleware/auth'
import { createMockTodosRepository } from './mocks/todos.repository.mock'
import type { Todo } from '../src/types/api'
import type { CreateTodoInput, UpdateTodoInput } from '../src/schemas/todos.schema'

/** Request shape used by todo handlers in tests; cast from minimal mock to satisfy AuthenticatedRequest. */
type TodoHandlerRequest = AuthenticatedRequest &
  Partial<ValidatedBodyRequest<CreateTodoInput | UpdateTodoInput>>

/** Response mock with chainable status/json/send for assertions. No `extends Response` to avoid jest.Mock vs Express `this` conflict. */
interface MockTodoResponse {
  status: jest.Mock<MockTodoResponse, [number]>
  json: jest.Mock<MockTodoResponse, [unknown]>
  send: jest.Mock<MockTodoResponse, [unknown?]>
}

describe('Todo handlers (unit)', () => {
  function mockReq(overrides: {
    uid?: string
    params?: Record<string, string>
    body?: Record<string, unknown>
    validatedBody?: CreateTodoInput | UpdateTodoInput
  } = {}): TodoHandlerRequest {
    return {
      uid: overrides.uid ?? 'test-uid',
      params: overrides.params ?? {},
      body: overrides.body ?? {},
      validatedBody: overrides.validatedBody,
    } as TodoHandlerRequest
  }

  function mockRes(): MockTodoResponse & Response {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as MockTodoResponse & Response
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
    it('creates todo and returns 201 using validatedBody', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({
        validatedBody: {
          title: 'New Todo',
          description: 'desc',
          dueDate: '2026-03-15',
        },
      })
      const res = mockRes()

      await handlers.createTodo(
        req as AuthenticatedRequest & ValidatedBodyRequest<CreateTodoInput>,
        res,
      )

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
    it('throws NotFoundError for non-existent id', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({
        params: { id: 'non-existent' },
        validatedBody: { title: 'x' },
      })
      const res = mockRes()

      await expect(
        handlers.updateTodo(
          req as AuthenticatedRequest & ValidatedBodyRequest<UpdateTodoInput>,
          res,
        ),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('throws ForbiddenError when uid does not own todo', async () => {
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
      const req = mockReq({
        params: { id: 't1' },
        validatedBody: { title: 'Hacked' },
      })
      const res = mockRes()

      await expect(
        handlers.updateTodo(
          req as AuthenticatedRequest & ValidatedBodyRequest<UpdateTodoInput>,
          res,
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    })

    it('updates todo and returns it using validatedBody', async () => {
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
        validatedBody: { title: 'Updated', completed: true },
      })
      const res = mockRes()

      await handlers.updateTodo(
        req as AuthenticatedRequest & ValidatedBodyRequest<UpdateTodoInput>,
        res,
      )

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
    it('throws NotFoundError for non-existent id', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 'non-existent' } })
      const res = mockRes()

      await expect(handlers.deleteTodo(req, res)).rejects.toBeInstanceOf(NotFoundError)
    })

    it('throws ForbiddenError when uid does not own todo', async () => {
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

      await expect(handlers.deleteTodo(req, res)).rejects.toBeInstanceOf(ForbiddenError)
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
    it('throws NotFoundError for non-existent id', async () => {
      const repo = createMockTodosRepository()
      const handlers = createTodoHandlers(repo)
      const req = mockReq({ params: { id: 'non-existent' } })
      const res = mockRes()

      await expect(handlers.toggleTodo(req, res)).rejects.toBeInstanceOf(NotFoundError)
    })

    it('throws ForbiddenError when uid does not own todo', async () => {
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

      await expect(handlers.toggleTodo(req, res)).rejects.toBeInstanceOf(ForbiddenError)
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
