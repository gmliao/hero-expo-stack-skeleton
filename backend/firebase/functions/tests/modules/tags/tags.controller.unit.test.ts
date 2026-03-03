import express from "express";
import request from "supertest";
import { TagsController } from "../../../src/modules/tags/tags.controller";
import { createRouteBuilder } from "../../../src/core/http/builder";
import { AppError } from "../../../src/core/http/errors";
import { createMockDeps } from "../../mocks/deps.mock";
import type { Deps } from "../../../src/core/deps.types";
import type { RequestContext } from "../../../src/core/http/endpoint";

function mockCtx(uid = "test-uid"): RequestContext {
  return {
    requestId: "req-1",
    uid,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    now: new Date(),
  };
}

function buildApp(deps?: Deps) {
  const depsResolved = deps ?? createMockDeps();
  const builder = createRouteBuilder(depsResolved);
  new TagsController().mount(builder);
  const app = express();
  app.use(express.json());
  builder.mount(app);
  return app;
}

describe("TagsController", () => {
  describe("metadata", () => {
    it("prefix is /tags", () => {
      expect(new TagsController().prefix).toBe("/tags");
    });

    it("has exactly 4 endpoints", () => {
      expect(new TagsController().endpoints()).toHaveLength(4);
    });

    it("endpoint ids are tags.list, tags.create, tags.update, tags.delete", () => {
      const ids = new TagsController().endpoints().map((e) => e.id);
      expect(ids).toContain("tags.list");
      expect(ids).toContain("tags.create");
      expect(ids).toContain("tags.update");
      expect(ids).toContain("tags.delete");
    });
  });

  describe("endpoint delegation (execute functions)", () => {
    it("tags.list delegates to services.tags.list", async () => {
      const deps = createMockDeps();
      const listDef = new TagsController()
        .endpoints()
        .find((e) => e.id === "tags.list")!;
      await listDef.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: {} },
      } as any);
      expect(deps.services.tags.list).toHaveBeenCalledWith("test-uid");
    });

    it("tags.create delegates to services.tags.create with uid and body.name", async () => {
      const deps = createMockDeps();
      const def = new TagsController()
        .endpoints()
        .find((e) => e.id === "tags.create")!;
      await def.execute({
        deps,
        ctx: mockCtx(),
        input: { body: { name: "Work" }, query: {}, params: {} },
      } as any);
      expect(deps.services.tags.create).toHaveBeenCalledWith("test-uid", "Work");
    });

    it("tags.update delegates to services.tags.update with tagId, uid, name", async () => {
      const deps = createMockDeps();
      const def = new TagsController()
        .endpoints()
        .find((e) => e.id === "tags.update")!;
      await def.execute({
        deps,
        ctx: mockCtx(),
        input: {
          body: { name: "Urgent" },
          query: {},
          params: { tagId: "tag-1" },
        },
      } as any);
      expect(deps.services.tags.update).toHaveBeenCalledWith(
        "tag-1",
        "test-uid",
        "Urgent",
      );
    });

    it("tags.update propagates AppError from service", async () => {
      const deps = createMockDeps();
      (deps.services.tags.update as jest.Mock).mockRejectedValue(
        new AppError("NOT_FOUND", "Tag not found"),
      );
      const def = new TagsController()
        .endpoints()
        .find((e) => e.id === "tags.update")!;
      await expect(
        def.execute({
          deps,
          ctx: mockCtx(),
          input: {
            body: { name: "x" },
            query: {},
            params: { tagId: "nope" },
          },
        } as any),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("tags.delete delegates to services.tags.delete and returns null", async () => {
      const deps = createMockDeps();
      const def = new TagsController()
        .endpoints()
        .find((e) => e.id === "tags.delete")!;
      const result = await def.execute({
        deps,
        ctx: mockCtx(),
        input: { body: {}, query: {}, params: { tagId: "tag-1" } },
      } as any);
      expect(result).toBeNull();
      expect(deps.services.tags.delete).toHaveBeenCalledWith("tag-1", "test-uid");
    });

    it("tags.delete propagates AppError from service", async () => {
      const deps = createMockDeps();
      (deps.services.tags.delete as jest.Mock).mockRejectedValue(
        new AppError("FORBIDDEN", "Forbidden"),
      );
      const def = new TagsController()
        .endpoints()
        .find((e) => e.id === "tags.delete")!;
      await expect(
        def.execute({
          deps,
          ctx: mockCtx(),
          input: { body: {}, query: {}, params: { tagId: "tag-1" } },
        } as any),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("HTTP routing (via mount)", () => {
    it("GET /tags returns 200 SuccessDto", async () => {
      const res = await request(buildApp())
        .get("/tags")
        .set("Authorization", "Bearer tok");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("POST /tags returns 201 SuccessDto", async () => {
      const res = await request(buildApp())
        .post("/tags")
        .set("Authorization", "Bearer tok")
        .send({ name: "New Tag" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("PATCH /tags/:tagId returns 200 SuccessDto", async () => {
      const res = await request(buildApp())
        .patch("/tags/tag-1")
        .set("Authorization", "Bearer tok")
        .send({ name: "Updated" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("DELETE /tags/:tagId returns 204", async () => {
      const res = await request(buildApp())
        .delete("/tags/tag-1")
        .set("Authorization", "Bearer tok");
      expect(res.status).toBe(204);
      expect(res.text).toBe("");
    });
  });
});
