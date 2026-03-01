import type { ZodSchema } from "zod";
import type { IAuthVerifier } from "../services/auth.types";
import type { ITodosService } from "../services/todos.types";

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

export interface DepsServices {
  todos: ITodosService;
}

export interface Deps {
  services: DepsServices;
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
