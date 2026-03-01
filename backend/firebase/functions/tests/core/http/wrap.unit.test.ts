import express from "express";
import request from "supertest";
import { defineEndpoint } from "../../../src/core/http/endpoint";
import { wrapEndpoint } from "../../../src/core/http/wrap";
import { AppError } from "../../../src/core/http/errors";
import type { Deps } from "../../../src/core/http/endpoint";
import { z } from "zod";
import { createMockDeps } from "../../mocks/deps.mock";

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

  describe("public: true (no auth)", () => {
    const endpoint = defineEndpoint({
      id: "test.public",
      method: "get",
      path: "/public",
      public: true,
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
      public: true,
      schemas: { body: bodySchema },
      execute: async ({ input }) => ({
        title: (input.body as { title: string }).title,
      }),
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
        public: true,
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
        public: true,
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
        public: true,
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
