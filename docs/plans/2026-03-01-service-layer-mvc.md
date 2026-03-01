# Service Layer (MVC) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 引入 Service 層形成完整 MVC 三層架構，將業務邏輯（uid 所有權驗證、domain rules）集中到 Service，讓 Endpoint（Controller）只負責 HTTP 輸入/輸出，禁止 Endpoint 直接存取 Repository。

**Architecture:** Endpoint → Service → Repository。`Deps` 移除 `todosRepo`，改注入 `todosService`（ITodosService 介面）。Service 內部持有 ITodosRepository，所有 uid 所有權檢查集中在 Service 方法內，Repository 保持 generic 資料存取層不含業務規則。

**Tech Stack:** TypeScript, Express 5, Firebase Functions v2, Zod, Jest.

---

### Task 1: 建立 ITodosService 介面 + TodosService 實作

**Files:**
- Create: `backend/firebase/functions/src/services/todos.types.ts`
- Create: `backend/firebase/functions/src/services/todos.service.ts`
- Test: `backend/firebase/functions/tests/services.todos.unit.test.ts`

**Step 1: Write the failing test**

建立 `tests/services.todos.unit.test.ts`：

```ts
import { TodosService } from "../src/services/todos.service";
import { AppError } from "../src/http/errors";
import { createMockTodosRepository } from "./mocks/todos.repository.mock";
import type { Todo } from "../src/types/api";

const baseTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: "t1",
  uid: "user-1",
  title: "Test",
  completed: false,
  createdAt: "",
  updatedAt: "",
  ...overrides,
});

describe("TodosService (unit)", () => {
  describe("listTodos", () => {
    it("returns todos for the user", async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo()] });
      const svc = new TodosService(repo);
      const result = await svc.listTodos("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].uid).toBe("user-1");
    });
  });

  describe("createTodo", () => {
    it("creates and returns todo owned by uid", async () => {
      const repo = createMockTodosRepository();
      const svc = new TodosService(repo);
      const result = await svc.createTodo("user-1", { title: "New" });
      expect(result.uid).toBe("user-1");
      expect(result.title).toBe("New");
    });
  });

  describe("updateTodo", () => {
    it("throws NOT_FOUND when todo does not exist", async () => {
      const repo = createMockTodosRepository();
      const svc = new TodosService(repo);
      await expect(svc.updateTodo("user-1", "nope", { title: "x" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws FORBIDDEN when uid does not own todo", async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo({ uid: "other" })] });
      const svc = new TodosService(repo);
      await expect(svc.updateTodo("user-1", "t1", { title: "x" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("updates and returns todo when uid matches", async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo()] });
      const svc = new TodosService(repo);
      const result = await svc.updateTodo("user-1", "t1", { title: "Updated" });
      expect(result.title).toBe("Updated");
    });
  });

  describe("toggleTodo", () => {
    it("throws NOT_FOUND when todo does not exist", async () => {
      const repo = createMockTodosRepository();
      const svc = new TodosService(repo);
      await expect(svc.toggleTodo("user-1", "nope")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws FORBIDDEN when uid does not own todo", async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo({ uid: "other" })] });
      const svc = new TodosService(repo);
      await expect(svc.toggleTodo("user-1", "t1")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("toggles completed and returns todo", async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo({ completed: false })] });
      const svc = new TodosService(repo);
      const result = await svc.toggleTodo("user-1", "t1");
      expect(result.completed).toBe(true);
    });
  });

  describe("deleteTodo", () => {
    it("throws NOT_FOUND when todo does not exist", async () => {
      const repo = createMockTodosRepository();
      const svc = new TodosService(repo);
      await expect(svc.deleteTodo("user-1", "nope")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws FORBIDDEN when uid does not own todo", async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo({ uid: "other" })] });
      const svc = new TodosService(repo);
      await expect(svc.deleteTodo("user-1", "t1")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("deletes successfully when uid matches", async () => {
      const repo = createMockTodosRepository({ todos: [baseTodo()] });
      const svc = new TodosService(repo);
      await expect(svc.deleteTodo("user-1", "t1")).resolves.toBeUndefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
- `cd backend/firebase/functions && bun run test:unit -- --testPathPattern=services.todos`

Expected: FAIL（找不到 `src/services/todos.service`）。

**Step 3: Write minimal implementation**

建立 `src/services/todos.types.ts`：

```ts
import type { Todo } from "../types/api";
import type { CreateTodoInput, UpdateTodoInput } from "./todos.service";

export interface ITodosService {
  listTodos(uid: string): Promise<Todo[]>;
  createTodo(uid: string, input: CreateTodoInput): Promise<Todo>;
  updateTodo(uid: string, id: string, data: UpdateTodoInput): Promise<Todo>;
  toggleTodo(uid: string, id: string): Promise<Todo>;
  deleteTodo(uid: string, id: string): Promise<void>;
}
```

建立 `src/services/todos.service.ts`：

```ts
import type { Todo } from "../types/api";
import type { ITodosRepository } from "../repositories/types";
import { AppError } from "../http/errors";

export type CreateTodoInput = {
  title: string;
  description?: string;
  dueDate?: string;
};

export type UpdateTodoInput = {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string | null;
};

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

  async updateTodo(uid: string, id: string, data: UpdateTodoInput): Promise<Todo> {
    await this.requireOwned(uid, id);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new AppError("NOT_FOUND", "Todo not found");
    return updated;
  }

  async toggleTodo(uid: string, id: string): Promise<Todo> {
    const todo = await this.repo.toggle(id, uid);
    if (!todo) {
      // toggle() returns null for both not-found and wrong-uid; disambiguate
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
```

更新 `src/services/todos.types.ts`（修正 import）：

```ts
import type { Todo } from "../types/api";
import type { CreateTodoInput, UpdateTodoInput } from "./todos.service";

export interface ITodosService {
  listTodos(uid: string): Promise<Todo[]>;
  createTodo(uid: string, input: CreateTodoInput): Promise<Todo>;
  updateTodo(uid: string, id: string, data: UpdateTodoInput): Promise<Todo>;
  toggleTodo(uid: string, id: string): Promise<Todo>;
  deleteTodo(uid: string, id: string): Promise<void>;
}
```

**Step 4: Run test to verify it passes**

Run:
- `cd backend/firebase/functions && bun run test:unit -- --testPathPattern=services.todos`

Expected: PASS。

**Step 5: Commit**

- `git add backend/firebase/functions/src/services/todos.types.ts backend/firebase/functions/src/services/todos.service.ts backend/firebase/functions/tests/services.todos.unit.test.ts`
- `git commit -m "feat(backend): add ITodosService interface and TodosService with ownership enforcement"`

---

### Task 2: 更新 Deps — 移除 todosRepo，注入 todosService

**Files:**
- Modify: `backend/firebase/functions/src/http/endpoint.ts`
- Modify: `backend/firebase/functions/src/deps.ts`
- Modify: `backend/firebase/functions/tests/mocks/` — 新增 `todos.service.mock.ts`

**Step 1: 更新 endpoint.ts 的 Deps 介面**

將 `todosRepo: ITodosRepository` 替換為 `todosService: ITodosService`：

```ts
// src/http/endpoint.ts
import type { ZodSchema } from "zod";
import type { IAuthVerifier } from "../services/auth.types";
import type { ITodosService } from "../services/todos.types";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface EndpointSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export interface Logger {
  info(msg: string, extra?: unknown): void;
  warn(msg: string, extra?: unknown): void;
  error(msg: string, extra?: unknown): void;
}

export interface RequestContext {
  requestId: string;
  uid?: string;
  logger: Logger;
  now: Date;
}

export interface Deps {
  todosService: ITodosService;
  auth: IAuthVerifier;
  logger: Logger;
}

export type ExecuteArgs<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> = {
  deps: Deps;
  ctx: RequestContext;
  input: { body: TBody; query: TQuery; params: TParams };
};

export interface EndpointDef<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResult = unknown,
> {
  id: string;
  method: HttpMethod;
  path: string;
  auth?: boolean;
  schemas?: EndpointSchemas;
  execute: (args: ExecuteArgs<TBody, TQuery, TParams>) => Promise<TResult>;
}

export function defineEndpoint<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResult = unknown,
>(
  def: EndpointDef<TBody, TQuery, TParams, TResult>,
): EndpointDef<TBody, TQuery, TParams, TResult> {
  return def;
}
```

**Step 2: 新增 todos.service.mock.ts**

建立 `tests/mocks/todos.service.mock.ts`：

```ts
import type { ITodosService } from "../../src/services/todos.types";
import type { CreateTodoInput, UpdateTodoInput } from "../../src/services/todos.service";
import type { Todo } from "../../src/types/api";

export function createMockTodosService(overrides: Partial<ITodosService> = {}): ITodosService {
  return {
    listTodos: jest.fn().mockResolvedValue([]),
    createTodo: jest.fn().mockResolvedValue({
      id: "mock-id",
      uid: "test-uid",
      title: "Mock Todo",
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Todo),
    updateTodo: jest.fn().mockResolvedValue({
      id: "mock-id",
      uid: "test-uid",
      title: "Updated",
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Todo),
    toggleTodo: jest.fn().mockResolvedValue({
      id: "mock-id",
      uid: "test-uid",
      title: "Mock Todo",
      completed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Todo),
    deleteTodo: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
```

**Step 3: 更新 deps.ts**

```ts
import type { Deps, Logger } from "./http/endpoint";
import { TodosFirestoreRepository } from "./repositories/todos.firestore.repository";
import { TodosService } from "./services/todos.service";
import { FirebaseAuthVerifier } from "./services/auth.firebase.service";

class ConsoleLogger implements Logger {
  info(msg: string, extra?: unknown) { console.log(msg, extra ?? ""); }
  warn(msg: string, extra?: unknown) { console.warn(msg, extra ?? ""); }
  error(msg: string, extra?: unknown) { console.error(msg, extra ?? ""); }
}

export function createDeps(): Deps {
  const todosRepo = new TodosFirestoreRepository();
  return {
    todosService: new TodosService(todosRepo),
    auth: new FirebaseAuthVerifier(),
    logger: new ConsoleLogger(),
  };
}
```

**Step 4: Run all unit tests (expect failures from endpoints)**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: FAIL — endpoint tests 和 wrap tests 引用 `deps.todosRepo` 會出錯。這是預期行為，Task 3 修。

**Step 5: Commit**

- `git add backend/firebase/functions/src/http/endpoint.ts backend/firebase/functions/src/deps.ts backend/firebase/functions/tests/mocks/todos.service.mock.ts`
- `git commit -m "feat(backend): replace todosRepo with todosService in Deps, add service mock"`

---

### Task 3: 重寫 5 個 Endpoint — 改用 todosService

**Files:**
- Modify: `backend/firebase/functions/src/endpoints/todos/createTodo.endpoint.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/listTodos.endpoint.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/updateTodo.endpoint.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/toggleTodo.endpoint.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/deleteTodo.endpoint.ts`
- Modify: `backend/firebase/functions/tests/endpoints.todos.unit.test.ts`

**Step 1: 重寫 5 個 endpoint**

`src/endpoints/todos/createTodo.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";
import { createTodoSchema } from "../../schemas/todos.schema";
import type { CreateTodoInput } from "../../services/todos.service";

export const createTodoEndpoint = defineEndpoint({
  id: "todos.create",
  method: "post",
  path: "/todos",
  auth: true,
  schemas: { body: createTodoSchema },
  execute: async ({ deps, ctx, input }) => {
    const body = input.body as CreateTodoInput;
    return deps.todosService.createTodo(ctx.uid!, body);
  },
});
```

`src/endpoints/todos/listTodos.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";

export const listTodosEndpoint = defineEndpoint({
  id: "todos.list",
  method: "get",
  path: "/todos",
  auth: true,
  execute: async ({ deps, ctx }) => {
    return deps.todosService.listTodos(ctx.uid!);
  },
});
```

`src/endpoints/todos/updateTodo.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";
import { updateTodoSchema } from "../../schemas/todos.schema";
import { z } from "zod";
import type { UpdateTodoInput } from "../../services/todos.service";

const paramsSchema = z.object({ id: z.string().min(1) });

export const updateTodoEndpoint = defineEndpoint({
  id: "todos.update",
  method: "patch",
  path: "/todos/:id",
  auth: true,
  schemas: { body: updateTodoSchema, params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const params = input.params as { id: string };
    const body = input.body as UpdateTodoInput;
    return deps.todosService.updateTodo(ctx.uid!, params.id, body);
  },
});
```

`src/endpoints/todos/toggleTodo.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const toggleTodoEndpoint = defineEndpoint({
  id: "todos.toggle",
  method: "patch",
  path: "/todos/:id/toggle",
  auth: true,
  schemas: { params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const params = input.params as { id: string };
    return deps.todosService.toggleTodo(ctx.uid!, params.id);
  },
});
```

`src/endpoints/todos/deleteTodo.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const deleteTodoEndpoint = defineEndpoint({
  id: "todos.delete",
  method: "delete",
  path: "/todos/:id",
  auth: true,
  schemas: { params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const params = input.params as { id: string };
    await deps.todosService.deleteTodo(ctx.uid!, params.id);
    return null;
  },
});
```

**Step 2: 重寫 endpoints.todos.unit.test.ts — 改用 service mock**

```ts
import { createTodoEndpoint } from "../src/endpoints/todos/createTodo.endpoint";
import { listTodosEndpoint } from "../src/endpoints/todos/listTodos.endpoint";
import { updateTodoEndpoint } from "../src/endpoints/todos/updateTodo.endpoint";
import { toggleTodoEndpoint } from "../src/endpoints/todos/toggleTodo.endpoint";
import { deleteTodoEndpoint } from "../src/endpoints/todos/deleteTodo.endpoint";
import { AppError } from "../src/http/errors";
import type { Deps, RequestContext } from "../src/http/endpoint";
import { createMockTodosService } from "./mocks/todos.service.mock";

function mockCtx(uid = "test-uid"): RequestContext {
  return {
    requestId: "req-1",
    uid,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    now: new Date(),
  };
}

function mockDeps(overrides: Partial<ReturnType<typeof createMockTodosService>> = {}): Deps {
  return {
    todosService: createMockTodosService(overrides),
    auth: { verifyIdToken: async () => ({ uid: "test-uid" }) },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}

describe("Todo endpoints (unit)", () => {
  describe("createTodo", () => {
    it("delegates to todosService.createTodo with uid and body", async () => {
      const deps = mockDeps();
      const result = await createTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: { title: "New", description: "", dueDate: undefined }, query: {}, params: {} },
      });
      expect(deps.todosService.createTodo).toHaveBeenCalledWith("test-uid", expect.objectContaining({ title: "New" }));
      expect(result).toBeDefined();
    });
  });

  describe("listTodos", () => {
    it("delegates to todosService.listTodos with uid", async () => {
      const deps = mockDeps();
      await listTodosEndpoint.execute({ deps, ctx: mockCtx(), input: { body: {}, query: {}, params: {} } });
      expect(deps.todosService.listTodos).toHaveBeenCalledWith("test-uid");
    });
  });

  describe("updateTodo", () => {
    it("delegates to todosService.updateTodo with uid, id, body", async () => {
      const deps = mockDeps();
      await updateTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: { title: "Updated" }, query: {}, params: { id: "t1" } },
      });
      expect(deps.todosService.updateTodo).toHaveBeenCalledWith("test-uid", "t1", expect.objectContaining({ title: "Updated" }));
    });

    it("propagates AppError from service", async () => {
      const deps = mockDeps({
        updateTodo: jest.fn().mockRejectedValue(new AppError("NOT_FOUND", "Todo not found")),
      });
      await expect(
        updateTodoEndpoint.execute({ deps, ctx: mockCtx(), input: { body: { title: "x" }, query: {}, params: { id: "nope" } } })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("toggleTodo", () => {
    it("delegates to todosService.toggleTodo with uid, id", async () => {
      const deps = mockDeps();
      await toggleTodoEndpoint.execute({ deps, ctx: mockCtx(), input: { body: {}, query: {}, params: { id: "t1" } } });
      expect(deps.todosService.toggleTodo).toHaveBeenCalledWith("test-uid", "t1");
    });

    it("propagates AppError from service", async () => {
      const deps = mockDeps({
        toggleTodo: jest.fn().mockRejectedValue(new AppError("FORBIDDEN", "Forbidden")),
      });
      await expect(
        toggleTodoEndpoint.execute({ deps, ctx: mockCtx(), input: { body: {}, query: {}, params: { id: "t1" } } })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("deleteTodo", () => {
    it("delegates to todosService.deleteTodo and returns null", async () => {
      const deps = mockDeps();
      const result = await deleteTodoEndpoint.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: { id: "t1" } },
      });
      expect(deps.todosService.deleteTodo).toHaveBeenCalledWith("test-uid", "t1");
      expect(result).toBeNull();
    });
  });
});
```

**Step 3: 更新 app.async-errors.unit.test.ts — 改用 todosService**

```ts
import request from "supertest";
import { buildApp } from "../src/app";
import type { Deps } from "../src/http/endpoint";

describe("app async errors (unit)", () => {
  it("returns 500 and FailureDto when async route throws", async () => {
    const deps: Deps = {
      todosService: {
        listTodos: async () => { throw new Error("db"); },
        createTodo: async () => { throw new Error("db"); },
        updateTodo: async () => { throw new Error("db"); },
        toggleTodo: async () => { throw new Error("db"); },
        deleteTodo: async () => { throw new Error("db"); },
      },
      auth: { verifyIdToken: async () => ({ uid: "test-uid" }) },
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    };
    const app = buildApp(deps);
    const res = await request(app)
      .get("/todos")
      .set("Authorization", "Bearer valid-token");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: "INTERNAL",
      message: "Internal error",
    });
  });
});
```

**Step 4: Run all backend unit tests**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS（全部通過）。

**Step 5: Commit**

- `git add backend/firebase/functions/src/endpoints/ backend/firebase/functions/tests/endpoints.todos.unit.test.ts backend/firebase/functions/tests/app.async-errors.unit.test.ts`
- `git commit -m "refactor(backend): endpoints delegate to todosService, remove direct repo access"`

---

### Task 4: 更新 wrap/builder unit tests — 改用 todosService mock

**Files:**
- Modify: `backend/firebase/functions/tests/http.wrap.unit.test.ts`
- Modify: `backend/firebase/functions/tests/http.builder.unit.test.ts`

**Step 1: 更新 createMockDeps() 在兩個測試檔**

`http.wrap.unit.test.ts` 的 `createMockDeps`：

```ts
function createMockDeps(overrides: Partial<Deps> = {}): Deps {
  return {
    todosService: {
      listTodos: jest.fn().mockResolvedValue([]),
      createTodo: jest.fn().mockResolvedValue({}),
      updateTodo: jest.fn().mockResolvedValue({}),
      toggleTodo: jest.fn().mockResolvedValue({}),
      deleteTodo: jest.fn().mockResolvedValue(undefined),
    },
    auth: {
      verifyIdToken: async () => ({
        uid: "test-uid",
        email: "test@example.com",
      }),
    },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    ...overrides,
  };
}
```

`http.builder.unit.test.ts` 的 `createMockDeps`：

```ts
function createMockDeps(): Deps {
  return {
    todosService: {
      listTodos: jest.fn().mockResolvedValue([]),
      createTodo: jest.fn().mockResolvedValue({}),
      updateTodo: jest.fn().mockResolvedValue({}),
      toggleTodo: jest.fn().mockResolvedValue({}),
      deleteTodo: jest.fn().mockResolvedValue(undefined),
    },
    auth: {
      verifyIdToken: async () => ({ uid: "test-uid", email: "test@test.com" }),
    },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}
```

同時移除兩個測試中 `import type { ITodosRepository }` 相關的 import（如果有的話）。

**Step 2: Run all backend unit tests**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS（全部通過）。

**Step 3: Commit**

- `git add backend/firebase/functions/tests/http.wrap.unit.test.ts backend/firebase/functions/tests/http.builder.unit.test.ts`
- `git commit -m "test(backend): update wrap/builder tests to use todosService mock"`

---

### Task 5: Backend build 驗證 + 更新 AGENTS.md

**Files:**
- Modify: `AGENTS.md`

**Step 1: Backend TypeScript build**

Run:
- `cd backend/firebase/functions && bun run build`

Expected: 無 TypeScript 錯誤。如有錯誤先修復再繼續。

**Step 2: 更新 AGENTS.md — 加入 MVC 架構規範**

在 `## Non-Negotiable Architecture` 段落的 `- **Backend error model (required):**` 之前加入：

```md
- **Backend MVC layers (required):** The backend follows a strict three-layer architecture. Each layer has a single responsibility and must only call the layer directly below it:
  - **Endpoint (Controller)** — `src/endpoints/<domain>/`: HTTP input/output only. Extract validated input, call the Service method, return the result. Must NOT import or reference any Repository interface or implementation. No business logic, no `findById`, no uid checks here.
  - **Service** — `src/services/<domain>.service.ts`: Business logic and authorization rules. Owns all uid ownership checks (`requireOwned`). Calls Repository for data access. Every public Service method takes `uid` as first parameter when operating on user-owned data. Must NOT have any HTTP or Express concepts.
  - **Repository** — `src/repositories/`: Pure data access (Firestore CRUD). No business logic, no uid ownership checks. Generic operations only.
- **No direct Endpoint → Repository access (required):** Endpoints must never call `deps.todosRepo` or any Repository method directly. All data access flows through the Service layer. The `Deps` interface exposes only `todosService: ITodosService`, not the Repository. Adding `todosRepo` back to `Deps` is prohibited.
- **Service interface for testability (required):** Every Service must have a corresponding `I<Domain>Service` interface (e.g. `ITodosService` in `src/services/todos.types.ts`). Endpoint unit tests inject a mock service (`tests/mocks/<domain>.service.mock.ts`); Service unit tests inject a mock repository. This ensures each layer is tested in isolation without the layer below.
```

**Step 3: Commit**

- `git add AGENTS.md`
- `git commit -m "docs: add MVC three-layer architecture rules to AGENTS.md"`

---

### Task 6: 全量驗證

**Step 1: Backend unit tests**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS。

**Step 2: Backend build**

Run:
- `cd backend/firebase/functions && bun run build`

Expected: PASS（TypeScript 編譯無錯誤）。

**Step 3: Client tests**

Run:
- `cd apps/client && bun run test`

Expected: PASS。

**Step 4: Client web build**

Run:
- `bun run check:web`

Expected: PASS。

**Step 5: Final commit (if any fixes)**

- `git add -A && git commit -m "fix: address issues from full verification"`

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-03-01-service-layer-mvc.md`.
