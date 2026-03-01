import express from "express";
import request from "supertest";
import { BaseController } from "../../../src/core/routes/base.controller";
import { createRouteBuilder } from "../../../src/core/http/builder";
import { defineEndpoint } from "../../../src/core/http/endpoint";
import { createMockDeps } from "../../mocks/deps.mock";

// Concrete test subclass
class PingController extends BaseController {
  readonly prefix = "/ping";

  endpoints() {
    return [
      defineEndpoint({
        id: "ping.get",
        method: "get",
        path: "",
        public: true,
        execute: async () => ({ pong: true }),
      }),
      defineEndpoint({
        id: "ping.item",
        method: "get",
        path: "/:id",
        public: true,
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
