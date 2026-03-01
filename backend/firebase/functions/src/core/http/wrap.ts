import type { Request, Response } from "express";
import { z, type ZodType } from "zod";
import type { Deps } from "../deps.types";
import type { EndpointDef } from "./endpoint";
import { AppError, mapErrorToFailureDto } from "./errors";
import { createRequestContext } from "./context";

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [kind, token] = header.split(" ");
  if (!kind || kind.toLowerCase() !== "bearer") return null;
  return token ?? null;
}

function parseWithSchema<T>(schema: ZodType<T> | undefined, value: unknown): T {
  if (!schema) {
    return value as T;
  }

  return schema.parse(value);
}

export function wrapEndpoint<TBody, TQuery, TParams, TResult>(
  def: EndpointDef<TBody, TQuery, TParams, TResult>,
  deps: Deps,
) {
  const requireAuth = !def.public;

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
      const params = parseWithSchema(schemas.params, req.params);
      const query = parseWithSchema(schemas.query, req.query);
      const body = parseWithSchema(schemas.body, req.body);

      // 3) execute
      const result = await def.execute({
        deps,
        ctx,
        input: { body, query, params },
      });

      // 4) response → SuccessDto
      if (def.successStatus === 204) {
        res.sendStatus(204);
        return;
      }

      res.status(def.successStatus ?? 200).json({ success: true, data: result });
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
