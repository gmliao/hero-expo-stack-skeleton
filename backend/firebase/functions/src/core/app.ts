import express from "express";
import cors from "cors";
import type { Deps } from "./deps.types";
import type { FailureDto } from "../types/api";
import { createRouteBuilder } from "./http/builder";
import { registerControllers } from "./routes";
import { preflightMiddleware } from "../middleware/preflight";

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
