import type {
  ITodosService,
  CreateTodoInput,
  UpdateTodoInput,
} from "./todos.types";
import type { Todo } from "../../types/api";
import type { ITodosRepository } from "../../infrastructure/firestore/repositories/repository.types";
import type { ITagsService } from "../tags/tags.types";
import { AppError } from "../../core/http/errors";

export class TodosService {
  constructor(
    private readonly repo: ITodosRepository,
    private readonly tagsService: ITagsService,
  ) {}

  async listTodos(uid: string): Promise<Todo[]> {
    return this.repo.findAllByUid(uid);
  }

  private async validateTagIdsBelongToUser(uid: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) return;
    const ownedTags = await this.tagsService.list(uid);
    const ownedSet = new Set(ownedTags.map((t) => t.id));
    const invalid = tagIds.filter((id) => !ownedSet.has(id));
    if (invalid.length > 0) {
      throw new AppError("FORBIDDEN", "One or more tagIds do not belong to the user");
    }
  }

  async createTodo(uid: string, input: CreateTodoInput): Promise<Todo> {
    const tagIds = input.tagIds ?? [];
    await this.validateTagIdsBelongToUser(uid, tagIds);
    return this.repo.create(uid, { ...input, tagIds });
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
    if (data.tagIds !== undefined) {
      await this.validateTagIdsBelongToUser(uid, data.tagIds);
    }
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
