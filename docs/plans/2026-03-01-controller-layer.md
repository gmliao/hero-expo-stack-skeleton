# Controller Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 引入 `BaseController` 抽象類別，讓每個 domain 用一個 Controller 類別管理同一 prefix 下的所有路由，同時將 `Deps.todosService` 重構為命名空間 `Deps.services.todos`，為未來跨 service 存取預留乾淨的擴展路徑。

**Architecture:** `BaseController` 持有 `prefix` 與 `endpoints()` 方法，`mount(builder)` 自動將 `prefix + endpoint.path` 拼成完整路由再交給 `RouteBuilder`。`Deps.services` 成為所有 domain service 的命名空間，`auth`/`logger` 等基礎設施保持在頂層；`TodosController` extends `BaseController`，內嵌 5 個 endpoint 定義並直接呼叫 `deps.services.todos.*`，取代原有的 5 個獨立 endpoint 檔案。

**Tech Stack:** TypeScript, Express, Zod, Jest, Firebase Functions v2.

---

### Task 1: 重構 `Deps` — 加入 `services` 命名空間

**Files:**
- Modify: `backend/firebase/functions/src/http/endpoint.ts`
- Modify: `backend/firebase/functions/src/deps.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/createTodo.endpoint.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/listTodos.endpoint.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/updateTodo.endpoint.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/toggleTodo.endpoint.ts`
- Modify: `backend/firebase/functions/src/endpoints/todos/deleteTodo.endpoint.ts`
- Modify: `backend/firebase/functions/tests/http.wrap.unit.test.ts`
- Modify: `backend/firebase/functions/tests/http.builder.unit.test.ts`
- Modify: `backend/firebase/functions/tests/app.async-errors.unit.test.ts`
- Modify: `backend/firebase/functions/tests/endpoints.todos.unit.test.ts`

**Step 1: 確認現有測試全部通過（baseline）**

```bash
cd backend/firebase/functions && bun run test:unit
```

Expected: 7 suites PASS, 44 tests。

**Step 2: 更新 `src/http/endpoint.ts` 的 `Deps` 介面**

將 `todosService: ITodosService` 移入 `services` 命名空間：

```ts
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

export interface DepsServices {
  todos: ITodosService;
}

export interface Deps {
  services: DepsServices;
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

**Step 3: 更新 `src/deps.ts`**

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
    services: {
      todos: new TodosService(todosRepo),
    },
    auth: new FirebaseAuthVerifier(),
    logger: new ConsoleLogger(),
  };
}
```

**Step 4: 更新 5 個 endpoint 檔案中的 `deps.todosService` → `deps.services.todos`**

`src/endpoints/todos/listTodos.endpoint.ts`：
```ts
import { defineEndpoint } from "../../http/endpoint";

export const listTodosEndpoint = defineEndpoint({
  id: "todos.list",
  method: "get",
  path: "/todos",
  auth: true,
  execute: async ({ deps, ctx }) => {
    return deps.services.todos.listTodos(ctx.uid!);
  },
});
```

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
    return deps.services.todos.createTodo(ctx.uid!, body);
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
    return deps.services.todos.updateTodo(ctx.uid!, params.id, body);
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
    return deps.services.todos.toggleTodo(ctx.uid!, params.id);
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
    await deps.services.todos.deleteTodo(ctx.uid!, params.id);
    return null;
  },
});
```

**Step 5: 更新測試中的 createMockDeps — 改用 `services` 命名空間**

`tests/http.wrap.unit.test.ts` 中的 `createMockDeps`：
```ts
function createMockDeps(overrides: Partial<Deps> = {}): Deps {
  return {
    services: {
      todos: {
        listTodos: jest.fn().mockResolvedValue([]),
        createTodo: jest.fn().mockResolvedValue({}),
        updateTodo: jest.fn().mockResolvedValue({}),
        toggleTodo: jest.fn().mockResolvedValue({}),
        deleteTodo: jest.fn().mockResolvedValue(undefined),
      },
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

`tests/http.builder.unit.test.ts` 中的 `createMockDeps`：
```ts
function createMockDeps(): Deps {
  return {
    services: {
      todos: {
        listTodos: jest.fn().mockResolvedValue([]),
        createTodo: jest.fn().mockResolvedValue({}),
        updateTodo: jest.fn().mockResolvedValue({}),
        toggleTodo: jest.fn().mockResolvedValue({}),
        deleteTodo: jest.fn().mockResolvedValue(undefined),
      },
    },
    auth: {
      verifyIdToken: async () => ({ uid: "test-uid", email: "test@test.com" }),
    },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}
```

`tests/app.async-errors.unit.test.ts` 的整個 deps 物件：
```ts
const deps: Deps = {
  services: {
    todos: {
      listTodos: async () => { throw new Error("db"); },
      createTodo: async () => { throw new Error("db"); },
      updateTodo: async () => { throw new Error("db"); },
      toggleTodo: async () => { throw new Error("db"); },
      deleteTodo: async () => { throw new Error("db"); },
    },
  },
  auth: { verifyIdToken: async () => ({ uid: "test-uid" }) },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
};
```

`tests/endpoints.todos.unit.test.ts` 中的 `mockDeps`：
```ts
function mockDeps(overrides: Partial<ReturnType<typeof createMockTodosService>> = {}): Deps {
  return {
    services: {
      todos: createMockTodosService(overrides),
    },
    auth: { verifyIdToken: async () => ({ uid: "test-uid" }) },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}
```

`tests/mocks/todos.service.mock.ts` 中的 `createMockTodosService` 不需改動，因為它只回傳 `ITodosService` 物件。

**Step 6: 執行 unit tests 確認全部通過**

```bash
cd backend/firebase/functions && bun run test:unit
```

Expected: 7 suites PASS。

**Step 7: Commit**

```bash
cd backend/firebase/functions
git add src/http/endpoint.ts src/deps.ts src/endpoints/todos/ \
  tests/http.wrap.unit.test.ts tests/http.builder.unit.test.ts \
  tests/app.async-errors.unit.test.ts tests/endpoints.todos.unit.test.ts
git commit -m "refactor(backend): namespace Deps.services for domain service injection"
```

---

### Task 2: 建立 `BaseController`

**Files:**
- Create: `backend/firebase/functions/src/controllers/base.controller.ts`
- Create: `backend/firebase/functions/tests/http.controller.unit.test.ts`

**Step 1: 撰寫失敗測試**

建立 `tests/http.controller.unit.test.ts`：

```ts
import express from "express";
import request from "supertest";
import { BaseController } from "../src/controllers/base.controller";
import { createRouteBuilder } from "../src/http/builder";
import { defineEndpoint } from "../src/http/endpoint";
import type { Deps } from "../src/http/endpoint";

function createMockDeps(): Deps {
  return {
    services: {
      todos: {
        listTodos: jest.fn().mockResolvedValue([]),
        createTodo: jest.fn().mockResolvedValue({}),
        updateTodo: jest.fn().mockResolvedValue({}),
        toggleTodo: jest.fn().mockResolvedValue({}),
        deleteTodo: jest.fn().mockResolvedValue(undefined),
      },
    },
    auth: { verifyIdToken: async () => ({ uid: "test-uid" }) },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}

// Concrete test subclass
class PingController extends BaseController {
  readonly prefix = "/ping";

  endpoints() {
    return [
      defineEndpoint({
        id: "ping.get",
        method: "get",
        path: "",
        auth: false,
        execute: async () => ({ pong: true }),
      }),
      defineEndpoint({
        id: "ping.item",
        method: "get",
        path: "/:id",
        auth: false,
        execute: async ({ input }) => ({
          id: (input.params as { id: string }).id,
        }),
      }),
    ];
  }
}

describe("BaseController", () => {
  function buildApp() {
    const deps = createMockDeps();
    const builder = createRouteBuilder(deps);
    new PingController().mount(builder);
    const app = express();
    app.use(express.json());
    builder.mount(app);
    return app;
  }

  it("mounts collection route at prefix", async () => {
    const res = await request(buildApp()).get("/ping");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { pong: true } });
  });

  it("mounts param route at prefix/:id", async () => {
    const res = await request(buildApp()).get("/ping/abc");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: "abc" } });
  });

  it("returns 404 for route outside prefix", async () => {
    const res = await request(buildApp()).get("/other");
    expect(res.status).toBe(404);
  });
});
```

**Step 2: 執行確認失敗**

```bash
cd backend/firebase/functions && bun run test:unit -- --testPathPattern=http.controller
```

Expected: FAIL（找不到 `src/controllers/base.controller`）。

**Step 3: 實作 `BaseController`**

建立 `src/controllers/base.controller.ts`：

```ts
import type { EndpointDef } from "../http/endpoint";
import type { createRouteBuilder } from "../http/builder";

export type RouteBuilder = ReturnType<typeof createRouteBuilder>;

export abstract class BaseController {
  abstract readonly prefix: string;
  abstract endpoints(): EndpointDef[];

  mount(builder: RouteBuilder): void {
    for (const def of this.endpoints()) {
      builder.add({ ...def, path: this.prefix + def.path });
    }
  }
}
```

**Step 4: 執行確認通過**

```bash
cd backend/firebase/functions && bun run test:unit -- --testPathPattern=http.controller
```

Expected: PASS（3 tests）。

**Step 5: Commit**

```bash
git add backend/firebase/functions/src/controllers/base.controller.ts \
  backend/firebase/functions/tests/http.controller.unit.test.ts
git commit -m "feat(backend): add BaseController with prefix mount logic"
```

---

### Task 3: 建立 `TodosController`

**Files:**
- Create: `backend/firebase/functions/src/controllers/todos.controller.ts`
- Create: `backend/firebase/functions/tests/controllers.todos.unit.test.ts`

**Step 1: 撰寫失敗測試**

建立 `tests/controllers.todos.unit.test.ts`：

```ts
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
```

**Step 2: 執行確認失敗**

```bash
cd backend/firebase/functions && bun run test:unit -- --testPathPattern=controllers.todos
```

Expected: FAIL（找不到 `src/controllers/todos.controller`）。

**Step 3: 實作 `TodosController`**

建立 `src/controllers/todos.controller.ts`：

```ts
import { z } from "zod";
import { BaseController } from "./base.controller";
import { defineEndpoint } from "../http/endpoint";
import { createTodoSchema, updateTodoSchema } from "../schemas/todos.schema";
import type { CreateTodoInput, UpdateTodoInput } from "../services/todos.service";

const idParams = z.object({ id: z.string().min(1) });

export class TodosController extends BaseController {
  readonly prefix = "/todos";

  endpoints() {
    return [
      defineEndpoint({
        id: "todos.list",
        method: "get",
        path: "",
        auth: true,
        execute: ({ deps, ctx }) =>
          deps.services.todos.listTodos(ctx.uid!),
      }),
      defineEndpoint({
        id: "todos.create",
        method: "post",
        path: "",
        auth: true,
        schemas: { body: createTodoSchema },
        execute: ({ deps, ctx, input }) =>
          deps.services.todos.createTodo(
            ctx.uid!,
            input.body as CreateTodoInput,
          ),
      }),
      defineEndpoint({
        id: "todos.update",
        method: "patch",
        path: "/:id",
        auth: true,
        schemas: { body: updateTodoSchema, params: idParams },
        execute: ({ deps, ctx, input }) =>
          deps.services.todos.updateTodo(
            ctx.uid!,
            (input.params as { id: string }).id,
            input.body as UpdateTodoInput,
          ),
      }),
      defineEndpoint({
        id: "todos.toggle",
        method: "patch",
        path: "/:id/toggle",
        auth: true,
        schemas: { params: idParams },
        execute: ({ deps, ctx, input }) =>
          deps.services.todos.toggleTodo(
            ctx.uid!,
            (input.params as { id: string }).id,
          ),
      }),
      defineEndpoint({
        id: "todos.delete",
        method: "delete",
        path: "/:id",
        auth: true,
        schemas: { params: idParams },
        execute: async ({ deps, ctx, input }) => {
          await deps.services.todos.deleteTodo(
            ctx.uid!,
            (input.params as { id: string }).id,
          );
          return null;
        },
      }),
    ];
  }
}
```

**Step 4: 執行確認通過**

```bash
cd backend/firebase/functions && bun run test:unit -- --testPathPattern=controllers.todos
```

Expected: PASS（全部通過）。

**Step 5: Commit**

```bash
git add backend/firebase/functions/src/controllers/todos.controller.ts \
  backend/firebase/functions/tests/controllers.todos.unit.test.ts
git commit -m "feat(backend): add TodosController grouping all /todos routes"
```

---

### Task 4: 接線 + 刪除舊 endpoint 檔案

**Files:**
- Modify: `backend/firebase/functions/src/routes/index.ts`
- Modify: `backend/firebase/functions/src/app.ts`
- Delete: `backend/firebase/functions/src/endpoints/todos/` (整個資料夾)
- Delete: `backend/firebase/functions/tests/endpoints.todos.unit.test.ts`
- Modify: `backend/firebase/functions/jest.config.js`

**Step 1: 更新 `src/routes/index.ts`**

```ts
import type { RouteBuilder } from "../controllers/base.controller";
import { TodosController } from "../controllers/todos.controller";

export function registerControllers(builder: RouteBuilder): void {
  new TodosController().mount(builder);
}
```

**Step 2: 更新 `src/app.ts`**

將 `registerEndpoints` 換成 `registerControllers`：

```ts
import express from "express";
import cors from "cors";
import type { Deps } from "./http/endpoint";
import type { FailureDto } from "./types/api";
import { createRouteBuilder } from "./http/builder";
import { registerControllers } from "./routes";
import { preflightMiddleware } from "./middleware/preflight";

export function buildApp(deps: Deps) {
  const app = express();

  app.use(preflightMiddleware);
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
    }),
  );
  app.use(express.json());

  const builder = createRouteBuilder(deps);
  registerControllers(builder);
  builder.mount(app);

  app.use((_req, res) => {
    const body: FailureDto = {
      success: false,
      error: "NOT_FOUND",
      message: "Route not found",
    };
    res.status(404).json(body);
  });

  return app;
}
```

**Step 3: 刪除舊 endpoint 檔案和過時測試**

```bash
cd backend/firebase/functions
rm -rf src/endpoints/
rm tests/endpoints.todos.unit.test.ts
```

**Step 4: 更新 `jest.config.js` coverage threshold**

將 `src/endpoints/**/*.ts` 改為 `src/controllers/**/*.ts`：

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: { statements: 0, branches: 0, functions: 0, lines: 0 },
    'src/http/**/*.ts': { statements: 65, branches: 45, functions: 65, lines: 65 },
    'src/controllers/**/*.ts': { statements: 65, branches: 45, functions: 65, lines: 65 },
  },
}
```

**Step 5: 執行所有 unit tests**

```bash
cd backend/firebase/functions && bun run test:unit
```

Expected: PASS。如有 TypeScript 編譯錯誤（舊的 import 路徑），在此步驟修正後重跑。

**Step 6: TypeScript build**

```bash
cd backend/firebase/functions && bun run build
```

Expected: 無 TypeScript 錯誤。

**Step 7: Commit**

```bash
git add backend/firebase/functions/src/routes/index.ts \
  backend/firebase/functions/src/app.ts \
  backend/firebase/functions/jest.config.js
git add -u backend/firebase/functions/src/endpoints/
git add -u backend/firebase/functions/tests/endpoints.todos.unit.test.ts
git commit -m "refactor(backend): wire TodosController, remove individual endpoint files"
```

---

### Task 5: 更新 AGENTS.md + 全量驗證

**Files:**
- Modify: `AGENTS.md`

**Step 1: 更新 AGENTS.md — Controller 規範**

在 `## Non-Negotiable Architecture` 中，找到 `- **No direct Endpoint → Repository access` 這一條，在其**上方**插入：

```md
- **Backend Controller layer (required):** Domain routes are grouped in Controller classes that extend `BaseController` (`src/controllers/base.controller.ts`). Each Controller declares a `prefix` (e.g. `/todos`) and an `endpoints()` method returning all `EndpointDef` for that domain. Route paths inside `endpoints()` are **relative** (e.g. `''`, `'/:id'`, `'/:id/toggle'`); `mount(builder)` automatically prepends the prefix. Controller files live in `src/controllers/<domain>.controller.ts`. Do not register routes manually in `app.ts` or `routes/index.ts`; use Controller classes instead.
- **Deps.services namespace (required):** All domain services are injected under `Deps.services` (e.g. `deps.services.todos`, `deps.services.auth`). Infrastructure (`auth: IAuthVerifier`, `logger: Logger`) stays at the top level of `Deps`. This allows cross-service access inside `execute()` via `deps.services.<domain>.*` without coupling Controller constructors to service instances. When adding a new domain service, add it to `DepsServices` in `src/http/endpoint.ts` and wire it in `createDeps()` in `src/deps.ts`.
```

**Step 2: Backend unit tests**

```bash
cd backend/firebase/functions && bun run test:unit
```

Expected: PASS。

**Step 3: Backend build**

```bash
cd backend/firebase/functions && bun run build
```

Expected: 無 TypeScript 錯誤。

**Step 4: Client tests**

```bash
cd apps/client && bun run test
```

Expected: PASS。

**Step 5: Web build**

```bash
bun run check:web
```

Expected: PASS。

**Step 6: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add Controller layer and Deps.services namespace rules to AGENTS.md"
```

---

## Execution Handoff

計畫已儲存至 `docs/plans/2026-03-01-controller-layer.md`。

**兩種執行方式：**

**1. Subagent-Driven（本 session）** — 每個 Task 派一個 subagent，完成後 review，快速迭代

**2. Parallel Session（另開 session）** — 在新 session 中用 executing-plans 執行，含 checkpoint review

**選擇哪種？**
