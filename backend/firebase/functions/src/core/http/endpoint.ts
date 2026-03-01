import type { ZodType, z } from "zod";
import type { IAuthVerifier } from "../../infrastructure/auth/auth.types";
import type { ITodosService } from "../../modules/todos/todos.types";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface EndpointSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
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
  path?: string; // default ""
  public?: true; // omit = requires auth; explicit public: true = skip auth
  schemas?: EndpointSchemas;
  execute: (args: ExecuteArgs<TBody, TQuery, TParams>) => Promise<TResult>;
}

type SchemaOut<T extends ZodType | undefined> = T extends ZodType
  ? z.infer<T>
  : unknown;

export function defineEndpoint<
  TBodySchema extends ZodType | undefined = undefined,
  TQuerySchema extends ZodType | undefined = undefined,
  TParamsSchema extends ZodType | undefined = undefined,
  TResult = unknown,
>(def: {
  id: string;
  method: HttpMethod;
  path?: string;
  public?: true;
  schemas?: {
    body?: TBodySchema;
    query?: TQuerySchema;
    params?: TParamsSchema;
  };
  execute: (
    args: ExecuteArgs<
      SchemaOut<TBodySchema>,
      SchemaOut<TQuerySchema>,
      SchemaOut<TParamsSchema>
    >,
  ) => Promise<TResult> | TResult;
}): EndpointDef {
  return def as EndpointDef;
}
