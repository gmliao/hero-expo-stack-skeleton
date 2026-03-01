import type { ZodType, z } from "zod";
import type { Deps } from "../deps.types";
export type { Logger, RequestContext } from "./types";
import type { RequestContext } from "./types";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface EndpointSchemas<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> {
  body?: ZodType<TBody>;
  query?: ZodType<TQuery>;
  params?: ZodType<TParams>;
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
  successStatus?: number;
  schemas?: EndpointSchemas<TBody, TQuery, TParams>;
  execute: (args: ExecuteArgs<TBody, TQuery, TParams>) => Promise<TResult> | TResult;
}

export type AnyEndpointDef = EndpointDef<any, any, any, any>;

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
  successStatus?: number;
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
}): EndpointDef<
  SchemaOut<TBodySchema>,
  SchemaOut<TQuerySchema>,
  SchemaOut<TParamsSchema>,
  TResult
> {
  return {
    ...def,
    schemas: def.schemas as EndpointSchemas<
      SchemaOut<TBodySchema>,
      SchemaOut<TQuerySchema>,
      SchemaOut<TParamsSchema>
    >,
  };
}
