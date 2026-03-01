import { createTodoEndpoint } from "../src/endpoints/todos/createTodo.endpoint";
import { listTodosEndpoint } from "../src/endpoints/todos/listTodos.endpoint";
import { updateTodoEndpoint } from "../src/endpoints/todos/updateTodo.endpoint";
import { toggleTodoEndpoint } from "../src/endpoints/todos/toggleTodo.endpoint";
import { deleteTodoEndpoint } from "../src/endpoints/todos/deleteTodo.endpoint";
import { AppError } from "../src/http/errors";
import type { Deps, RequestContext } from "../src/http/endpoint";
import { createMockTodosRepository } from "./mocks/todos.repository.mock";
import type { Todo } from "../src/types/api";

function mockCtx(uid = "test-uid"): RequestContext {
  return {
    requestId: "req-1",
    uid,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    now: new Date(),
  };
}

function mockDeps(overrides: { todos?: Todo[] } = {}): Deps {
  return {
    todosRepo: createMockTodosRepository({ todos: overrides.todos }),
    auth: { verifyIdToken: async () => ({ uid: "test-uid" }) },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}

describe("Todo endpoints (unit)", () => {
  describe("createTodo", () => {
    it("creates and returns todo", async () => {
      const deps = mockDeps();
      const result = await createTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: {
          body: { title: "New", description: "", dueDate: undefined },
          query: {},
          params: {},
        },
      });
      expect(result).toEqual(
        expect.objectContaining({ title: "New", uid: "test-uid" }),
      );
    });
  });

  describe("listTodos", () => {
    it("returns todos for user", async () => {
      const deps = mockDeps({
        todos: [
          {
            id: "1",
            uid: "test-uid",
            title: "A",
            completed: false,
            createdAt: "",
            updatedAt: "",
          },
        ],
      });
      const result = await listTodosEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: {} },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("updateTodo", () => {
    it("throws NOT_FOUND for non-existent id", async () => {
      const deps = mockDeps();
      await expect(
        updateTodoEndpoint.execute({
          deps,
          ctx: mockCtx(),
          input: { body: { title: "x" }, query: {}, params: { id: "nope" } },
        }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it("throws FORBIDDEN when uid does not own todo", async () => {
      const deps = mockDeps({
        todos: [
          {
            id: "t1",
            uid: "other",
            title: "X",
            completed: false,
            createdAt: "",
            updatedAt: "",
          },
        ],
      });
      await expect(
        updateTodoEndpoint.execute({
          deps,
          ctx: mockCtx(),
          input: { body: { title: "x" }, query: {}, params: { id: "t1" } },
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("toggleTodo", () => {
    it("throws NOT_FOUND for non-existent id", async () => {
      const deps = mockDeps();
      await expect(
        toggleTodoEndpoint.execute({
          deps,
          ctx: mockCtx(),
          input: { body: {}, query: {}, params: { id: "nope" } },
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("toggles and returns todo", async () => {
      const deps = mockDeps({
        todos: [
          {
            id: "t1",
            uid: "test-uid",
            title: "Toggle",
            completed: false,
            createdAt: "",
            updatedAt: "",
          },
        ],
      });
      const result = await toggleTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: { id: "t1" } },
      });
      expect(result).toEqual(expect.objectContaining({ completed: true }));
    });
  });

  describe("deleteTodo", () => {
    it("throws NOT_FOUND for non-existent id", async () => {
      const deps = mockDeps();
      await expect(
        deleteTodoEndpoint.execute({
          deps,
          ctx: mockCtx(),
          input: { body: {}, query: {}, params: { id: "nope" } },
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("deletes and returns null", async () => {
      const deps = mockDeps({
        todos: [
          {
            id: "t1",
            uid: "test-uid",
            title: "Del",
            completed: false,
            createdAt: "",
            updatedAt: "",
          },
        ],
      });
      const result = await deleteTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: { id: "t1" } },
      });
      expect(result).toBeNull();
    });
  });
});
