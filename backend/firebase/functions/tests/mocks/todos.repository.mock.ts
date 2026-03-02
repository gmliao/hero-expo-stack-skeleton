import type { Todo } from '../../src/types/api'
import type { ITodosRepository, CreateTodoInput } from '../../src/infrastructure/firestore/repositories/repository.types'
import type { UpdateTodoRequest } from '../../src/types/api'

export function createMockTodosRepository(initial: {
  todos?: Todo[]
} = {}): ITodosRepository & { todos: Todo[] } {
  const todos = [...(initial.todos ?? [])]

  return {
    todos,

    async findAllByUid(uid: string): Promise<Todo[]> {
      return todos.filter(t => t.uid === uid).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    },

    async create(uid: string, data: CreateTodoInput): Promise<Todo> {
      const now = new Date().toISOString()
      const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const todo: Todo = {
        id,
        uid,
        title: data.title.trim(),
        description: data.description ?? '',
        completed: false,
        createdAt: now,
        updatedAt: now,
        dueDate: data.dueDate ? String(data.dueDate).trim() || undefined : undefined,
        tagIds: data.tagIds ?? [],
      }
      todos.push(todo)
      return todo
    },

    async findById(id: string): Promise<Todo | null> {
      return todos.find(t => t.id === id) ?? null
    },

    async update(id: string, body: Partial<UpdateTodoRequest>): Promise<Todo | null> {
      const idx = todos.findIndex(t => t.id === id)
      if (idx < 0) return null
      const existing = todos[idx]
      const updates: Partial<Todo> = { updatedAt: new Date().toISOString() }
      if (body.title !== undefined) updates.title = body.title.trim()
      if (body.description !== undefined) updates.description = body.description ?? ''
      if (body.completed !== undefined) updates.completed = body.completed
      if (body.dueDate !== undefined) updates.dueDate = body.dueDate?.trim() || undefined
      if (body.tagIds !== undefined) updates.tagIds = body.tagIds
      todos[idx] = { ...existing, ...updates }
      return todos[idx]
    },

    async delete(id: string): Promise<boolean> {
      const idx = todos.findIndex(t => t.id === id)
      if (idx < 0) return false
      todos.splice(idx, 1)
      return true
    },

    async toggle(id: string, uid: string): Promise<Todo | null> {
      const idx = todos.findIndex(t => t.id === id)
      if (idx < 0) return null
      const doc = todos[idx]
      if (doc.uid !== uid) return null
      const updated = { ...doc, completed: !doc.completed, updatedAt: new Date().toISOString() }
      todos[idx] = updated
      return updated
    },
  }
}
