import express from "express";
import request from "supertest";
import { createRouteBuilder } from "../src/http/builder";
import { defineEndpoint } from "../src/http/endpoint";
import { createMockDeps } from "./mocks/deps.mock";

describe("createRouteBuilder (unit)", () => {
  it("mounts GET and POST endpoints", async () => {
    const deps = createMockDeps();
    const builder = createRouteBuilder(deps);

    builder.add(
      defineEndpoint({
        id: "test.get",
        method: "get",
        path: "/items",
        public: true,
        execute: async () => [{ id: "1" }],
      }),
    );

    builder.add(
      defineEndpoint({
        id: "test.post",
        method: "post",
        path: "/items",
        public: true,
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
        public: true,
        execute: async () => ({}),
      }),
    );

    expect(result).toBe(builder);
  });
});
