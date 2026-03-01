# Route Builder 微框架 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** 建立宣告式 Route Builder 微框架，統一 AppError/FailureDto 錯誤出口，遷移現有 todos endpoints，並在客戶端統一 API 錯誤處理。

**Architecture:** Server 端新增 `http/` 核心（defineEndpoint/wrapEndpoint/RouteBuilder），用 `AppError`（ErrorCode enum）取代 `HttpError` 家族。Client 端 `request()` 改讀 `FailureDto` 的 `error`（ErrorCode），全域 mutation `onError` 用 `Alert.alert()`。

**Tech Stack:** Express 5, Firebase Functions v2, Zod, Jest, Supertest, React Native (Alert), TanStack Query.

---

### Task 1: 建立 AppError + ErrorCode + mapErrorToFailureDto

**Files:**

- Create: `backend/firebase/functions/src/http/errors.ts`
- Test: `backend/firebase/functions/tests/http.errors.unit.test.ts`

**Step 1: Write the failing test**

建立 `tests/http.errors.unit.test.ts`：

```ts
import { AppError, mapErrorToFailureDto } from "../src/http/errors";
import type { ErrorCode } from "../src/http/errors";

describe("AppError (unit)", () => {
  it("NOT_FOUND has status 404", () => {
    const err = new AppError("NOT_FOUND", "Todo not found");
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Todo not found");
  });

  it("UNAUTHENTICATED has status 401", () => {
    const err = new AppError("UNAUTHENTICATED", "Missing token");
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
  });

  it("FORBIDDEN has status 403", () => {
    const err = new AppError("FORBIDDEN");
    expect(err.status).toBe(403);
    expect(err.message).toBe("FORBIDDEN");
  });

  it("VALIDATION_ERROR has status 400", () => {
    const err = new AppError("VALIDATION_ERROR", "title is required");
    expect(err.status).toBe(400);
  });

  it("INTERNAL has status 500", () => {
    const err = new AppError("INTERNAL");
    expect(err.status).toBe(500);
  });

  it("preserves details", () => {
    const err = new AppError("UNAUTHENTICATED", "Token expired", {
      subCode: "TOKEN_EXPIRED",
    });
    expect(err.details).toEqual({ subCode: "TOKEN_EXPIRED" });
  });

  it("is instanceof Error", () => {
    const err = new AppError("NOT_FOUND");
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("mapErrorToFailureDto (unit)", () => {
  it("maps AppError to FailureDto with ErrorCode", () => {
    const err = new AppError("NOT_FOUND", "Todo not found");
    const result = mapErrorToFailureDto(err);
    expect(result.status).toBe(404);
    expect(result.body).toEqual({
      success: false,
      error: "NOT_FOUND",
      message: "Todo not found",
    });
  });

  it("maps AppError with subCode to FailureDto with code field", () => {
    const err = new AppError("UNAUTHENTICATED", "Token expired", {
      subCode: "TOKEN_EXPIRED",
    });
    const result = mapErrorToFailureDto(err);
    expect(result.status).toBe(401);
    expect(result.body).toEqual({
      success: false,
      error: "UNAUTHENTICATED",
      code: "TOKEN_EXPIRED",
      message: "Token expired",
    });
  });

  it("maps unknown Error to INTERNAL 500", () => {
    const result = mapErrorToFailureDto(new Error("boom"));
    expect(result.status).toBe(500);
    expect(result.body).toEqual({
      success: false,
      error: "INTERNAL",
      message: "Internal error",
    });
  });

  it("maps non-Error to INTERNAL 500", () => {
    const result = mapErrorToFailureDto("string error");
    expect(result.status).toBe(500);
    expect(result.body.error).toBe("INTERNAL");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

- `cd backend/firebase/functions && bun run test:unit -- --testPathPattern=http.errors`

Expected: FAIL（找不到 `src/http/errors`）。

**Step 3: Write minimal implementation**

建立 `src/http/errors.ts`：

```ts
import type { FailureDto } from "../types/api";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL";

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL: 500,
};

export class AppError extends Error {
  public readonly status: number;

  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? code);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "AppError";
    this.status = ERROR_STATUS_MAP[code];
    Error.captureStackTrace?.(this, new.target);
  }
}

export function mapErrorToFailureDto(err: unknown): {
  status: number;
  body: FailureDto;
} {
  if (err instanceof AppError) {
    const body: FailureDto = {
      success: false,
      error: err.code,
      message: err.message,
    };
    if (
      err.details &&
      typeof err.details === "object" &&
      "subCode" in err.details &&
      typeof (err.details as Record<string, unknown>).subCode === "string"
    ) {
      body.code = (err.details as Record<string, unknown>).subCode as string;
    }
    return { status: err.status, body };
  }

  return {
    status: 500,
    body: { success: false, error: "INTERNAL", message: "Internal error" },
  };
}
```

**Step 4: Run test to verify it passes**

Run:

- `cd backend/firebase/functions && bun run test:unit -- --testPathPattern=http.errors`

Expected: PASS。

**Step 5: Commit**

- `git add backend/firebase/functions/src/http/errors.ts backend/firebase/functions/tests/http.errors.unit.test.ts`
- `git commit -m "feat(backend): add AppError with ErrorCode enum and mapErrorToFailureDto"`

---

### Task 2: 建立 RequestContext + wrapEndpoint + defineEndpoint

**Files:**

- Create: `backend/firebase/functions/src/http/endpoint.ts`
- Create: `backend/firebase/functions/src/http/context.ts`
- Create: `backend/firebase/functions/src/http/wrap.ts`
- Test: `backend/firebase/functions/tests/http.wrap.unit.test.ts`

**Step 1: Write the failing test**

建立 `tests/http.wrap.unit.test.ts`：

```ts
import express from "express";
import request from "supertest";
import { defineEndpoint } from "../src/http/endpoint";
import { wrapEndpoint } from "../src/http/wrap";
import { AppError } from "../src/http/errors";
import type { Deps } from "../src/http/endpoint";
import { z } from "zod";

function createMockDeps(overrides: Partial<Deps> = {}): Deps {
  return {
    todosRepo: {} as any,
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

function createApp(def: ReturnType<typeof defineEndpoint>, deps: Deps) {
  const app = express();
  app.use(express.json());
  const handler = wrapEndpoint(def, deps);
  (app as any)[def.method](def.path, handler);
  return app;
}

describe("wrapEndpoint (unit)", () => {
  describe("auth", () => {
    const endpoint = defineEndpoint({
      id: "test.auth",
      method: "get",
      path: "/test",
      auth: true,
      execute: async () => ({ ok: true }),
    });

    it("returns 401 FailureDto when no Authorization header", async () => {
      const app = createApp(endpoint, createMockDeps());
      const res = await request(app).get("/test");
      expect(res.status).toBe(401);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          error: "UNAUTHENTICATED",
        }),
      );
    });

    it("returns 401 FailureDto when token verification fails", async () => {
      const deps = createMockDeps({
        auth: {
          verifyIdToken: async () => {
            throw new Error("invalid");
          },
        },
      });
      const app = createApp(endpoint, deps);
      const res = await request(app)
        .get("/test")
        .set("Authorization", "Bearer bad");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("UNAUTHENTICATED");
    });

    it("passes with valid token and sets ctx.uid", async () => {
      const app = createApp(endpoint, createMockDeps());
      const res = await request(app)
        .get("/test")
        .set("Authorization", "Bearer valid");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { ok: true } });
    });
  });

  describe("auth: false", () => {
    const endpoint = defineEndpoint({
      id: "test.public",
      method: "get",
      path: "/public",
      auth: false,
      execute: async () => ({ message: "hello" }),
    });

    it("does not require auth header", async () => {
      const app = createApp(endpoint, createMockDeps());
      const res = await request(app).get("/public");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { message: "hello" } });
    });
  });

  describe("validation", () => {
    const bodySchema = z.object({ title: z.string().min(1) });
    const endpoint = defineEndpoint({
      id: "test.validate",
      method: "post",
      path: "/items",
      auth: false,
      schemas: { body: bodySchema },
      execute: async ({ input }) => ({ title: input.body.title }),
    });

    it("returns 400 VALIDATION_ERROR when body fails schema", async () => {
      const app = createApp(endpoint, createMockDeps());
      const res = await request(app).post("/items").send({ title: "" });
      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          error: "VALIDATION_ERROR",
        }),
      );
    });

    it("passes with valid body", async () => {
      const app = createApp(endpoint, createMockDeps());
      const res = await request(app).post("/items").send({ title: "Test" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { title: "Test" } });
    });
  });

  describe("error mapping", () => {
    it("maps AppError to correct status and FailureDto", async () => {
      const endpoint = defineEndpoint({
        id: "test.notfound",
        method: "get",
        path: "/missing",
        auth: false,
        execute: async () => {
          throw new AppError("NOT_FOUND", "Item not found");
        },
      });
      const app = createApp(endpoint, createMockDeps());
      const res = await request(app).get("/missing");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: "NOT_FOUND",
        message: "Item not found",
      });
    });

    it("maps unknown error to 500 INTERNAL", async () => {
      const endpoint = defineEndpoint({
        id: "test.crash",
        method: "get",
        path: "/crash",
        auth: false,
        execute: async () => {
          throw new Error("db connection lost");
        },
      });
      const app = createApp(endpoint, createMockDeps());
      const res = await request(app).get("/crash");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        error: "INTERNAL",
        message: "Internal error",
      });
    });
  });

  describe("SuccessDto wrapping", () => {
    it("wraps raw return value in SuccessDto", async () => {
      const endpoint = defineEndpoint({
        id: "test.raw",
        method: "get",
        path: "/raw",
        auth: false,
        execute: async () => ({ id: "1", name: "test" }),
      });
      const app = createApp(endpoint, createMockDeps());
      const res = await request(app).get("/raw");
      expect(res.body).toEqual({
        success: true,
        data: { id: "1", name: "test" },
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

- `cd backend/firebase/functions && bun run test:unit -- --testPathPattern=http.wrap`

Expected: FAIL（找不到 `src/http/endpoint` 等模組）。

**Step 3: Write minimal implementation**

建立 `src/http/endpoint.ts`：

```ts
import type { ZodSchema } from "zod";
import type { IAuthVerifier, TokenPayload } from "../services/auth.types";
import type { ITodosRepository } from "../repositories/types";

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
  todosRepo: ITodosRepository;
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
  auth?: boolean; // default true
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

建立 `src/http/context.ts`：

```ts
import type { Request } from "express";
import type { Deps, RequestContext } from "./endpoint";

function genRequestId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createRequestContext(req: Request, deps: Deps): RequestContext {
  const requestId = (req.headers["x-request-id"] as string) || genRequestId();
  return {
    requestId,
    logger: deps.logger,
    now: new Date(),
  };
}
```

建立 `src/http/wrap.ts`：

```ts
import type { Request, Response } from "express";
import { z } from "zod";
import type { Deps, EndpointDef } from "./endpoint";
import { AppError, mapErrorToFailureDto } from "./errors";
import { createRequestContext } from "./context";

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [kind, token] = header.split(" ");
  if (!kind || kind.toLowerCase() !== "bearer") return null;
  return token ?? null;
}

export function wrapEndpoint(def: EndpointDef, deps: Deps) {
  const requireAuth = def.auth !== false;

  return async (req: Request, res: Response): Promise<void> => {
    const ctx = createRequestContext(req, deps);

    try {
      // 1) auth
      if (requireAuth) {
        const token = getBearerToken(req);
        if (!token) {
          throw new AppError("UNAUTHENTICATED", "Missing bearer token", {
            subCode: "MISSING_AUTH_HEADER",
          });
        }
        try {
          const decoded = await deps.auth.verifyIdToken(token);
          ctx.uid = decoded.uid;
        } catch (verifyErr: unknown) {
          const subCode =
            (verifyErr as { code?: string })?.code === "auth/id-token-expired"
              ? "TOKEN_EXPIRED"
              : "INVALID_TOKEN";
          throw new AppError("UNAUTHENTICATED", "Unauthorized", { subCode });
        }
      }

      // 2) validate
      const schemas = def.schemas ?? {};
      const params = schemas.params
        ? schemas.params.parse(req.params)
        : req.params;
      const query = schemas.query ? schemas.query.parse(req.query) : req.query;
      const body = schemas.body ? schemas.body.parse(req.body) : req.body;

      // 3) execute
      const result = await def.execute({
        deps,
        ctx,
        input: { body, query, params },
      } as any);

      // 4) response → SuccessDto
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      // Zod → VALIDATION_ERROR
      if (err instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: err.issues.map((i) => i.message).join("; "),
        });
        return;
      }

      const mapped = mapErrorToFailureDto(err);
      res.status(mapped.status).json(mapped.body);
    }
  };
}
```

**Step 4: Run test to verify it passes**

Run:

- `cd backend/firebase/functions && bun run test:unit -- --testPathPattern=http.wrap`

Expected: PASS。

**Step 5: Commit**

- `git add backend/firebase/functions/src/http/endpoint.ts backend/firebase/functions/src/http/context.ts backend/firebase/functions/src/http/wrap.ts backend/firebase/functions/tests/http.wrap.unit.test.ts`
- `git commit -m "feat(backend): add defineEndpoint, wrapEndpoint, and RequestContext"`

---

### Task 3: 建立 RouteBuilder

**Files:**

- Create: `backend/firebase/functions/src/http/builder.ts`
- Test: `backend/firebase/functions/tests/http.builder.unit.test.ts`

**Step 1: Write the failing test**

建立 `tests/http.builder.unit.test.ts`：

```ts
import express from "express";
import request from "supertest";
import { createRouteBuilder } from "../src/http/builder";
import { defineEndpoint } from "../src/http/endpoint";
import type { Deps } from "../src/http/endpoint";

function createMockDeps(): Deps {
  return {
    todosRepo: {} as any,
    auth: {
      verifyIdToken: async () => ({ uid: "test-uid", email: "test@test.com" }),
    },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}

describe("createRouteBuilder (unit)", () => {
  it("mounts GET and POST endpoints", async () => {
    const deps = createMockDeps();
    const builder = createRouteBuilder(deps);

    builder.add(
      defineEndpoint({
        id: "test.get",
        method: "get",
        path: "/items",
        auth: false,
        execute: async () => [{ id: "1" }],
      }),
    );

    builder.add(
      defineEndpoint({
        id: "test.post",
        method: "post",
        path: "/items",
        auth: false,
        schemas: {},
        execute: async ({ input }) => ({ created: true }),
      }),
    );

    const app = express();
    app.use(express.json());
    builder.mount(app);

    const getRes = await request(app).get("/items");
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual({ success: true, data: [{ id: "1" }] });

    const postRes = await request(app).post("/items").send({});
    expect(postRes.status).toBe(200);
    expect(postRes.body).toEqual({ success: true, data: { created: true } });
  });

  it("supports chaining with add()", () => {
    const deps = createMockDeps();
    const builder = createRouteBuilder(deps);

    const result = builder.add(
      defineEndpoint({
        id: "test.chain",
        method: "get",
        path: "/chain",
        auth: false,
        execute: async () => ({}),
      }),
    );

    expect(result).toBe(builder);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

- `cd backend/firebase/functions && bun run test:unit -- --testPathPattern=http.builder`

Expected: FAIL。

**Step 3: Write minimal implementation**

建立 `src/http/builder.ts`：

```ts
import type { Express } from "express";
import type { Deps, EndpointDef } from "./endpoint";
import { wrapEndpoint } from "./wrap";

export function createRouteBuilder(deps: Deps) {
  const endpoints: EndpointDef[] = [];

  return {
    add(def: EndpointDef) {
      endpoints.push(def);
      return this;
    },

    mount(app: Express) {
      for (const def of endpoints) {
        const handler = wrapEndpoint(def, deps);
        (app as any)[def.method](def.path, handler);
      }
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run:

- `cd backend/firebase/functions && bun run test:unit -- --testPathPattern=http.builder`

Expected: PASS。

**Step 5: Commit**

- `git add backend/firebase/functions/src/http/builder.ts backend/firebase/functions/tests/http.builder.unit.test.ts`
- `git commit -m "feat(backend): add createRouteBuilder for declarative endpoint registration"`

---

### Task 4: 用 DSL 重寫 todos endpoints + routes 註冊

**Files:**

- Create: `backend/firebase/functions/src/endpoints/todos/createTodo.endpoint.ts`
- Create: `backend/firebase/functions/src/endpoints/todos/listTodos.endpoint.ts`
- Create: `backend/firebase/functions/src/endpoints/todos/updateTodo.endpoint.ts`
- Create: `backend/firebase/functions/src/endpoints/todos/toggleTodo.endpoint.ts`
- Create: `backend/firebase/functions/src/endpoints/todos/deleteTodo.endpoint.ts`
- Create: `backend/firebase/functions/src/routes/index.ts`

**Step 1: Write endpoint declarations**

`src/endpoints/todos/createTodo.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";
import { createTodoSchema } from "../../schemas/todos.schema";

export const createTodoEndpoint = defineEndpoint({
  id: "todos.create",
  method: "post",
  path: "/todos",
  auth: true,
  schemas: { body: createTodoSchema },
  execute: async ({ deps, ctx, input }) => {
    return deps.todosRepo.create(ctx.uid!, {
      title: input.body.title,
      description: input.body.description,
      dueDate: input.body.dueDate,
    });
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
    return deps.todosRepo.findAllByUid(ctx.uid!);
  },
});
```

`src/endpoints/todos/updateTodo.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";
import { updateTodoSchema } from "../../schemas/todos.schema";
import { AppError } from "../../http/errors";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const updateTodoEndpoint = defineEndpoint({
  id: "todos.update",
  method: "patch",
  path: "/todos/:id",
  auth: true,
  schemas: { body: updateTodoSchema, params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const existing = await deps.todosRepo.findById(input.params.id);
    if (!existing) throw new AppError("NOT_FOUND", "Todo not found");
    if (existing.uid !== ctx.uid) throw new AppError("FORBIDDEN", "Forbidden");
    const updated = await deps.todosRepo.update(input.params.id, input.body);
    if (!updated) throw new AppError("NOT_FOUND", "Todo not found");
    return updated;
  },
});
```

`src/endpoints/todos/toggleTodo.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";
import { AppError } from "../../http/errors";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const toggleTodoEndpoint = defineEndpoint({
  id: "todos.toggle",
  method: "patch",
  path: "/todos/:id/toggle",
  auth: true,
  schemas: { params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const todo = await deps.todosRepo.toggle(input.params.id, ctx.uid!);
    if (!todo) {
      const existing = await deps.todosRepo.findById(input.params.id);
      if (!existing) throw new AppError("NOT_FOUND", "Todo not found");
      throw new AppError("FORBIDDEN", "Forbidden");
    }
    return todo;
  },
});
```

`src/endpoints/todos/deleteTodo.endpoint.ts`：

```ts
import { defineEndpoint } from "../../http/endpoint";
import { AppError } from "../../http/errors";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const deleteTodoEndpoint = defineEndpoint({
  id: "todos.delete",
  method: "delete",
  path: "/todos/:id",
  auth: true,
  schemas: { params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const existing = await deps.todosRepo.findById(input.params.id);
    if (!existing) throw new AppError("NOT_FOUND", "Todo not found");
    if (existing.uid !== ctx.uid) throw new AppError("FORBIDDEN", "Forbidden");
    await deps.todosRepo.delete(input.params.id);
    return null;
  },
});
```

`src/routes/index.ts`：

```ts
import type { createRouteBuilder } from "../http/builder";
import { createTodoEndpoint } from "../endpoints/todos/createTodo.endpoint";
import { listTodosEndpoint } from "../endpoints/todos/listTodos.endpoint";
import { updateTodoEndpoint } from "../endpoints/todos/updateTodo.endpoint";
import { toggleTodoEndpoint } from "../endpoints/todos/toggleTodo.endpoint";
import { deleteTodoEndpoint } from "../endpoints/todos/deleteTodo.endpoint";

export function registerEndpoints(
  builder: ReturnType<typeof createRouteBuilder>,
) {
  builder
    .add(createTodoEndpoint)
    .add(listTodosEndpoint)
    .add(updateTodoEndpoint)
    .add(toggleTodoEndpoint)
    .add(deleteTodoEndpoint);
}
```

**Step 2: No test step here** — endpoints are tested in Task 5 + Task 6.

**Step 3: Commit**

- `git add backend/firebase/functions/src/endpoints/ backend/firebase/functions/src/routes/`
- `git commit -m "feat(backend): add todos endpoint declarations and route registration"`

---

### Task 5: 組裝 app.ts + deps.ts + 改寫 index.ts

**Files:**

- Create: `backend/firebase/functions/src/app.ts`
- Create: `backend/firebase/functions/src/deps.ts`
- Modify: `backend/firebase/functions/src/index.ts`
- Modify: `backend/firebase/functions/src/middleware/error.ts`（改用 `mapErrorToFailureDto`）

**Step 1: Write app.ts**

```ts
import express from "express";
import cors from "cors";
import type { Deps } from "./http/endpoint";
import type { FailureDto } from "./types/api";
import { createRouteBuilder } from "./http/builder";
import { registerEndpoints } from "./routes";
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
  registerEndpoints(builder);
  builder.mount(app);

  // 404 handler — FailureDto
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

**Step 2: Write deps.ts**

```ts
import type { Deps, Logger } from "./http/endpoint";
import { TodosFirestoreRepository } from "./repositories/todos.firestore.repository";
import { FirebaseAuthVerifier } from "./services/auth.firebase.service";

class ConsoleLogger implements Logger {
  info(msg: string, extra?: unknown) {
    console.log(msg, extra ?? "");
  }
  warn(msg: string, extra?: unknown) {
    console.warn(msg, extra ?? "");
  }
  error(msg: string, extra?: unknown) {
    console.error(msg, extra ?? "");
  }
}

export function createDeps(): Deps {
  return {
    todosRepo: new TodosFirestoreRepository(),
    auth: new FirebaseAuthVerifier(),
    logger: new ConsoleLogger(),
  };
}
```

**Step 3: Rewrite index.ts**

```ts
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { buildApp } from "./app";
import { createDeps } from "./deps";

initializeApp();

export const api = onRequest(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 60 },
  buildApp(createDeps()),
);
```

**Step 4: Run all backend unit tests**

Run:

- `cd backend/firebase/functions && bun run test:unit`

Expected: existing tests that import `HttpError`/old errors will FAIL — this is expected, fixed in Task 6.

**Step 5: Commit**

- `git add backend/firebase/functions/src/app.ts backend/firebase/functions/src/deps.ts backend/firebase/functions/src/index.ts`
- `git commit -m "feat(backend): add buildApp, createDeps, rewrite index.ts entry point"`

---

### Task 6: 遷移現有測試 + 移除舊 HttpError

**Files:**

- Modify: `backend/firebase/functions/tests/http.errors.unit.test.ts`（已完成，不動）
- Modify: `backend/firebase/functions/tests/lib.errors.unit.test.ts` → **刪除**（被 http.errors.unit.test.ts 取代）
- Modify: `backend/firebase/functions/tests/middleware.error.unit.test.ts` → **刪除**（wrapEndpoint 已內建 error mapping）
- Modify: `backend/firebase/functions/tests/middleware.auth.unit.test.ts` → **刪除**（wrapEndpoint 已內建 auth）
- Modify: `backend/firebase/functions/tests/middleware.validateBody.unit.test.ts` → **刪除**（wrapEndpoint 已內建 validation）
- Modify: `backend/firebase/functions/tests/middleware.preflight.unit.test.ts` → **保留**（preflight 仍獨立）
- Modify: `backend/firebase/functions/tests/handlers.todos.unit.test.ts` → **重寫** 為 endpoint execute 測試
- Modify: `backend/firebase/functions/tests/app.async-errors.unit.test.ts` → **更新** 用 AppError
- Delete: `backend/firebase/functions/src/lib/errors.ts`（被 `http/errors.ts` 取代）
- Delete: `backend/firebase/functions/src/middleware/auth.ts`（auth 邏輯移入 `http/wrap.ts`）
- Delete: `backend/firebase/functions/src/middleware/error.ts`（error mapping 移入 `http/wrap.ts`）
- Delete: `backend/firebase/functions/src/handlers/todos.ts`（被 `endpoints/todos/` 取代）

**Step 1: 重寫 handlers.todos.unit.test.ts → endpoints.todos.unit.test.ts**

新建 `tests/endpoints.todos.unit.test.ts`：測試每個 endpoint 的 `execute` 函式，mock deps。涵蓋：

- `createTodo`：valid input → returns todo
- `listTodos`：returns array
- `updateTodo`：not found → AppError('NOT_FOUND')、forbidden → AppError('FORBIDDEN')、success
- `toggleTodo`：not found → AppError('NOT_FOUND')、forbidden → AppError('FORBIDDEN')、success
- `deleteTodo`：not found → AppError('NOT_FOUND')、forbidden → AppError('FORBIDDEN')、success returns null

```ts
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
```

**Step 2: 更新 app.async-errors.unit.test.ts**

改用 `buildApp` + mock deps 直接測整合 async error：

```ts
import request from "supertest";
import { buildApp } from "../src/app";
import type { Deps } from "../src/http/endpoint";

describe("app async errors (unit)", () => {
  it("returns 500 and FailureDto when async route throws", async () => {
    const deps: Deps = {
      todosRepo: {
        findAllByUid: async () => {
          throw new Error("db");
        },
        create: async () => {
          throw new Error("db");
        },
        findById: async () => null,
        update: async () => null,
        delete: async () => false,
        toggle: async () => null,
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

**Step 3: 刪除舊檔案**

```bash
rm backend/firebase/functions/src/lib/errors.ts
rm backend/firebase/functions/src/middleware/auth.ts
rm backend/firebase/functions/src/middleware/error.ts
rm backend/firebase/functions/src/handlers/todos.ts
rm backend/firebase/functions/tests/lib.errors.unit.test.ts
rm backend/firebase/functions/tests/middleware.error.unit.test.ts
rm backend/firebase/functions/tests/middleware.auth.unit.test.ts
rm backend/firebase/functions/tests/middleware.validateBody.unit.test.ts
rm backend/firebase/functions/tests/handlers.todos.unit.test.ts
```

注意：`src/lib/validate.ts` 保留（`parseBody` 可能仍被 client 測試引用，或未來使用）或也可移除如果不再引用。需在實作時確認。

**Step 4: 更新 imports**

確認所有 `src/` 下不再有任何 import 引用到被移除的檔案。如果 `src/lib/validate.ts` 的 `validateBody` 不再使用也可清理。

**Step 5: Run all backend unit tests**

Run:

- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS（全部測試用新架構）。

**Step 6: Commit**

- `git add -A backend/firebase/functions/`
- `git commit -m "refactor(backend): migrate from HttpError to AppError, rewrite tests for endpoint DSL"`

---

### Task 7: Client — request() 改讀 FailureDto + 全域 Alert

**Files:**

- Modify: `apps/client/src/data/api.ts`
- Modify: `apps/client/app/_layout.tsx`

**Step 1: Modify api.ts**

改 `toHttpError` → `toApiError`，讀 `FailureDto.error`（ErrorCode）：

```ts
import type { FailureDto } from "@shared/types/api";

function toApiError(dto: FailureDto, status: number): Error {
  const message = dto.message ?? dto.error;
  switch (dto.error) {
    case "UNAUTHENTICATED":
      return new AuthError(message, status);
    case "FORBIDDEN":
      return new PermissionError(message, status);
    default:
      return new ApiError(message, status);
  }
}
```

修改 `request()` 的 `!response.ok` 分支：

```ts
if (!response.ok) {
  const body = await response.json().catch(() => null);

  if (response.status === 401) {
    await handleUnauthorized();
  }

  // 結構化 FailureDto
  if (body && body.success === false) {
    throw toApiError(body as FailureDto, response.status);
  }

  // fallback
  const message =
    typeof body?.error === "string" ? body.error : `HTTP ${response.status}`;
  throw new ApiError(message, response.status);
}
```

移除舊 `toHttpError` 函式。

**Step 2: Modify \_layout.tsx — 加全域 mutation onError**

```ts
import { Alert } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: "always",
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
      onError: (error: Error) => {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        Alert.alert("Error", message);
      },
    },
  },
});
```

**Step 3: Run client tests**

Run:

- `cd apps/client && bun run test`

Expected: PASS（client tests 不直接測 api module 的 internals，應該不受影響）。

**Step 4: Commit**

- `git add apps/client/src/data/api.ts apps/client/app/_layout.tsx`
- `git commit -m "feat(client): read FailureDto ErrorCode, add global mutation error alert"`

---

### Task 8: 更新 AGENTS.md

**Files:**

- Modify: `AGENTS.md`

**Step 1: 新增三條規範到 `## Non-Negotiable Architecture` 段落**

在 `## Non-Negotiable Architecture` 段落的 `- Query/state split:` 前面加入：

```md
- **Backend error model (required):** All backend errors must use `AppError` from `src/http/errors.ts` with constrained `ErrorCode` enum (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL`). Do not throw raw `Error` or legacy `HttpError`; do not use freeform string error codes. All HTTP error responses must conform to `FailureDto` format from `shared/types/api.ts`: `{ success: false, error: ErrorCode, code?: subCode, message?: string }`. The `error` field is always an `ErrorCode` value; optional `code` is for sub-classification (e.g. `TOKEN_EXPIRED`).
- **Backend endpoint DSL (required):** New endpoints must use `defineEndpoint()` from `src/http/endpoint.ts`. Do not register routes manually in `index.ts`. Auth, validation, error handling, and DTO wrapping are handled by `wrapEndpoint()` automatically. Endpoint declarations live in `src/endpoints/<domain>/`. Route registration lives in `src/routes/index.ts`.
- **Client API error handling (required):** `data/api.ts` must parse `FailureDto` from response body and construct typed errors using `ErrorCode`. Global mutation `onError` in `_layout.tsx` surfaces errors via `Alert.alert()` so E2E tests can detect failures instead of seeing silent timeouts.
```

**Step 2: 更新 backend validation 規範**

將 `- **Backend validation (required):**` 段落更新，移除 `parseBody(res, body, schema)` 提法，改為 `defineEndpoint` 的 `schemas` 欄位：

```md
- **Backend validation (required):** Validate request input with **Zod** schemas declared in `defineEndpoint({ schemas: { body, query, params } })`. Schemas live in `src/schemas/` (e.g. `todos.schema.ts`). `wrapEndpoint` handles parsing and returns `FailureDto` with `error: 'VALIDATION_ERROR'` on failure.
```

**Step 3: Commit**

- `git add AGENTS.md`
- `git commit -m "docs: update AGENTS.md with AppError, endpoint DSL, and client error rules"`

---

### Task 9: 全量驗證

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

**Step 5: (Optional) Backend integration tests**

Run:

- `bun run test:backend`

Expected: PASS（若本機有 Java + emulator）。注意 integration tests（`tests/todos.test.ts`, `tests/auth.test.ts`）可能需要更新以反映新的 FailureDto `error` 欄位格式。

**Step 6: Final commit (if any fixes)**

- `git add -A && git commit -m "fix: address issues from full verification"`

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-03-01-route-builder-implementation.md`.

Next step: run `.agent/workflows/execute-plan.md` to execute this plan task-by-task in single-flow mode.
