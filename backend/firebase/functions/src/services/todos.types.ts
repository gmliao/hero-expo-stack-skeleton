import type { Todo } from '../types/api'
import type { CreateTodoInput, UpdateTodoInput } from './todos.service'

export interface ITodosService {
  listTodos(uid: string): Promise<Todo[]>
  createTodo(uid: string, input: CreateTodoInput): Promise<Todo>
  updateTodo(uid: string, id: string, data: UpdateTodoInput): Promise<Todo>
  toggleTodo(uid: string, id: string): Promise<Todo>
  deleteTodo(uid: string, id: string): Promise<void>
}
