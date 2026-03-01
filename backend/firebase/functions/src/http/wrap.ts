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
