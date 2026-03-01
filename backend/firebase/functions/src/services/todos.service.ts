import type {
  ITodosService,
  CreateTodoInput,
  UpdateTodoInput,
} from "./todos.types";
import type { Todo } from "../types/api";
import type { ITodosRepository } from "../repositories/types";
import { AppError } from "../http/errors";

export class TodosService {
  constructor(private readonly repo: ITodosRepository) {}

  async listTodos(uid: string): Promise<Todo[]> {
    return this.repo.findAllByUid(uid);
  }

  async createTodo(uid: string, input: CreateTodoInput): Promise<Todo> {
    return this.repo.create(uid, input);
  }

  private async requireOwned(uid: string, id: string): Promise<Todo> {
    const todo = await this.repo.findById(id);
    if (!todo) throw new AppError("NOT_FOUND", "Todo not found");
    if (todo.uid !== uid) throw new AppError("FORBIDDEN", "Forbidden");
    return todo;
  }

  async updateTodo(
    uid: string,
    id: string,
    data: UpdateTodoInput,
  ): Promise<Todo> {
    await this.requireOwned(uid, id);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new AppError("NOT_FOUND", "Todo not found");
    return updated;
  }

  async toggleTodo(uid: string, id: string): Promise<Todo> {
    const todo = await this.repo.toggle(id, uid);
    if (!todo) {
      const existing = await this.repo.findById(id);
      if (!existing) throw new AppError("NOT_FOUND", "Todo not found");
      throw new AppError("FORBIDDEN", "Forbidden");
    }
    return todo;
  }

  async deleteTodo(uid: string, id: string): Promise<void> {
    await this.requireOwned(uid, id);
    await this.repo.delete(id);
  }
}
