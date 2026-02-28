import { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { ITodosRepository } from '../repositories/types'
import { createTodoSchema, updateTodoSchema } from '../schemas/todos.schema'
import { parseBody } from '../lib/validate'

export function createTodoHandlers(repo: ITodosRepository) {
  async function getTodos(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = req.uid!
    const todos = await repo.findAllByUid(uid)
    res.json(todos)
  }

  async function createTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = req.uid!
    const data = parseBody(res, req.body, createTodoSchema)
    if (!data) return
    const todo = await repo.create(uid, {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
    })
    res.status(201).json(todo)
  }

  async function toggleTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = req.uid!
    const { id } = req.params
    const todo = await repo.toggle(id, uid)
    if (!todo) {
      const existing = await repo.findById(id)
      if (!existing) {
        res.status(404).json({ error: 'Todo not found' })
        return
      }
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    res.json(todo)
  }

  async function updateTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = req.uid!
    const { id } = req.params
    const body = parseBody(res, req.body, updateTodoSchema)
    if (!body) return
    const existing = await repo.findById(id)
    if (!existing) {
      res.status(404).json({ error: 'Todo not found' })
      return
    }
    if (existing.uid !== uid) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const updates = {
      ...body,
      dueDate: body.dueDate ?? undefined,
    }
    const todo = await repo.update(id, updates)
    if (!todo) {
      res.status(404).json({ error: 'Todo not found' })
      return
    }
    res.json(todo)
  }

  async function deleteTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = req.uid!
    const { id } = req.params
    const existing = await repo.findById(id)
    if (!existing) {
      res.status(404).json({ error: 'Todo not found' })
      return
    }
    if (existing.uid !== uid) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    await repo.delete(id)
    res.status(204).send()
  }

  return { getTodos, createTodo, toggleTodo, updateTodo, deleteTodo }
}
