import type { Request } from "express";
import type { Deps } from "../deps.types";
import type { RequestContext } from "./types";

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
