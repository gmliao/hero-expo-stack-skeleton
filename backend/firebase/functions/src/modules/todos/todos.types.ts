import type { Todo } from "../../types/api";

export type CreateTodoInput = {
  title: string;
  description?: string;
  dueDate?: string;
  tagIds?: string[];
};

export type UpdateTodoInput = {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string | null;
  tagIds?: string[];
};

export interface ITodosService {
  listTodos(uid: string): Promise<Todo[]>;
  createTodo(uid: string, input: CreateTodoInput): Promise<Todo>;
  updateTodo(uid: string, id: string, data: UpdateTodoInput): Promise<Todo>;
  toggleTodo(uid: string, id: string): Promise<Todo>;
  deleteTodo(uid: string, id: string): Promise<void>;
}
