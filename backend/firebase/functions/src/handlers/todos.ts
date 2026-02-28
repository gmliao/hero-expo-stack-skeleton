import { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { ITodosRepository } from '../repositories/types'
import type { CreateTodoInput, UpdateTodoInput } from '../schemas/todos.schema'
import type { ValidatedBodyRequest } from '../lib/validate'
import { NotFoundError, ForbiddenError } from '../lib/errors'

export function createTodoHandlers(repo: ITodosRepository) {
  async function getTodos(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = req.uid!
    const todos = await repo.findAllByUid(uid)
    res.json(todos)
  }

  async function createTodo(
    req: AuthenticatedRequest & ValidatedBodyRequest<CreateTodoInput>,
    res: Response,
  ): Promise<void> {
    const uid = req.uid!
    const data = req.validatedBody
    const todo = await repo.create(uid, {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
    })
    res.status(201).json(todo)
  }

  async function toggleTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = req.uid!
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0] ?? ''
    const todo = await repo.toggle(id, uid)
    if (!todo) {
      const existing = await repo.findById(id)
      if (!existing) {
        throw new NotFoundError('Todo not found')
      }
      throw new ForbiddenError('Forbidden')
    }
    res.json(todo)
  }

  async function updateTodo(
    req: AuthenticatedRequest & ValidatedBodyRequest<UpdateTodoInput>,
    res: Response,
  ): Promise<void> {
    const uid = req.uid!
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0] ?? ''
    const body = req.validatedBody
    const existing = await repo.findById(id)
    if (!existing) {
      throw new NotFoundError('Todo not found')
    }
    if (existing.uid !== uid) {
      throw new ForbiddenError('Forbidden')
    }
    const updates = { ...body }
    const todo = await repo.update(id, updates)
    if (!todo) {
      throw new NotFoundError('Todo not found')
    }
    res.json(todo)
  }

  async function deleteTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = req.uid!
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0] ?? ''
    const existing = await repo.findById(id)
    if (!existing) {
      throw new NotFoundError('Todo not found')
    }
    if (existing.uid !== uid) {
      throw new ForbiddenError('Forbidden')
    }
    await repo.delete(id)
    res.status(204).send()
  }

  return { getTodos, createTodo, toggleTodo, updateTodo, deleteTodo }
}
