/**
 * Repository interfaces — abstract all external I/O (Firestore, etc.).
 * Implementations inject real or mock backends; handlers depend only on these interfaces.
 */
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../../types/api'

export interface CreateTodoInput {
  title: string
  description?: string
  dueDate?: string
}

export interface ITodosRepository {
  findAllByUid(uid: string): Promise<Todo[]>
  create(uid: string, data: CreateTodoInput): Promise<Todo>
  findById(id: string): Promise<Todo | null>
  update(id: string, data: Partial<UpdateTodoRequest>): Promise<Todo | null>
  delete(id: string): Promise<boolean>
  /** Atomic toggle; returns null if not found or uid does not own. */
  toggle(id: string, uid: string): Promise<Todo | null>
}
