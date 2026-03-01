import express from "express";
import request from "supertest";
import { TodosController } from "../src/controllers/todos.controller";
import { createRouteBuilder } from "../src/http/builder";
import { AppError } from "../src/http/errors";
import { createMockTodosService } from "./mocks/todos.service.mock";
import type { Deps, RequestContext } from "../src/http/endpoint";

function mockCtx(uid = "test-uid"): RequestContext {
  return {
    requestId: "req-1",
    uid,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    now: new Date(),
  };
}

function mockDeps(
  overrides: Partial<ReturnType<typeof createMockTodosService>> = {},
): Deps {
  return {
    services: { todos: createMockTodosService(overrides) },
    auth: { verifyIdToken: async () => ({ uid: "test-uid" }) },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}

function buildApp(
  overrides: Partial<ReturnType<typeof createMockTodosService>> = {},
) {
  const deps = mockDeps(overrides);
  const builder = createRouteBuilder(deps);
  new TodosController().mount(builder);
  const app = express();
  app.use(express.json());
  builder.mount(app);
  return app;
}

describe("TodosController", () => {
  describe("metadata", () => {
    it("prefix is /todos", () => {
      expect(new TodosController().prefix).toBe("/todos");
    });

    it("has exactly 5 endpoints", () => {
      expect(new TodosController().endpoints()).toHaveLength(5);
    });

    it("endpoint ids are todos.list/create/update/toggle/delete", () => {
      const ids = new TodosController().endpoints().map((e) => e.id);
      expect(ids).toContain("todos.list");
      expect(ids).toContain("todos.create");
      expect(ids).toContain("todos.update");
      expect(ids).toContain("todos.toggle");
      expect(ids).toContain("todos.delete");
    });
  });

  describe("endpoint delegation (execute functions)", () => {
    it("todos.list delegates to services.todos.listTodos", async () => {
      const deps = mockDeps();
      const listDef = new TodosController()
        .endpoints()
        .find((e) => e.id === "todos.list")!;
      await listDef.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: {} },
      } as any);
      expect(deps.services.todos.listTodos).toHaveBeenCalledWith("test-uid");
    });

    it("todos.create delegates to services.todos.createTodo", async () => {
      const deps = mockDeps();
      const def = new TodosController()
        .endpoints()
        .find((e) => e.id === "todos.create")!;
      await def.execute({
        deps,
        ctx: mockCtx(),
        input: { body: { title: "New" }, query: {}, params: {} },
      } as any);
      expect(deps.services.todos.createTodo).toHaveBeenCalledWith(
        "test-uid",
        expect.objectContaining({ title: "New" }),
      );
    });

    it("todos.update propagates AppError from service", async () => {
      const deps = mockDeps({
        updateTodo: jest
          .fn()
          .mockRejectedValue(new AppError("NOT_FOUND", "Todo not found")),
      });
      const def = new TodosController()
        .endpoints()
        .find((e) => e.id === "todos.update")!;
      await expect(
        def.execute({
          deps,
          ctx: mockCtx(),
          input: {
            body: { title: "x" },
            query: {},
            params: { id: "nope" },
          },
        } as any),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("todos.toggle propagates AppError from service", async () => {
      const deps = mockDeps({
        toggleTodo: jest
          .fn()
          .mockRejectedValue(new AppError("FORBIDDEN", "Forbidden")),
      });
      const def = new TodosController()
        .endpoints()
        .find((e) => e.id === "todos.toggle")!;
      await expect(
        def.execute({
          deps,
          ctx: mockCtx(),
          input: { body: {}, query: {}, params: { id: "t1" } },
        } as any),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("todos.delete returns null", async () => {
      const deps = mockDeps();
      const def = new TodosController()
        .endpoints()
        .find((e) => e.id === "todos.delete")!;
      const result = await def.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: { id: "t1" } },
      } as any);
      expect(result).toBeNull();
      expect(deps.services.todos.deleteTodo).toHaveBeenCalledWith(
        "test-uid",
        "t1",
      );
    });
  });

  describe("HTTP routing (via mount)", () => {
    it("GET /todos returns 200 SuccessDto", async () => {
      const res = await request(buildApp()).get("/todos").set("Authorization", "Bearer tok");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("POST /todos returns 200 SuccessDto", async () => {
      const res = await request(buildApp())
        .post("/todos")
        .set("Authorization", "Bearer tok")
        .send({ title: "New Todo" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("PATCH /todos/:id returns 200 SuccessDto", async () => {
      const res = await request(buildApp())
        .patch("/todos/t1")
        .set("Authorization", "Bearer tok")
        .send({ title: "Updated" });
      expect(res.status).toBe(200);
    });

    it("PATCH /todos/:id/toggle returns 200 SuccessDto", async () => {
      const res = await request(buildApp())
        .patch("/todos/t1/toggle")
        .set("Authorization", "Bearer tok");
      expect(res.status).toBe(200);
    });

    it("DELETE /todos/:id returns 200 SuccessDto", async () => {
      const res = await request(buildApp())
        .delete("/todos/t1")
        .set("Authorization", "Bearer tok");
      expect(res.status).toBe(200);
    });
  });
});
