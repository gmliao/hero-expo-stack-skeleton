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
