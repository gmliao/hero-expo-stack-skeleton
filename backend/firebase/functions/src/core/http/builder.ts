import type { Express, RequestHandler } from "express";
import type { Deps } from "../deps.types";
import type { AnyEndpointDef, HttpMethod } from "./endpoint";
import { wrapEndpoint } from "./wrap";

export function createRouteBuilder(deps: Deps) {
  const endpoints: AnyEndpointDef[] = [];

  return {
    add(def: AnyEndpointDef) {
      endpoints.push(def);
      return this;
    },

    mount(app: Express) {
      const addRoute: Record<
        HttpMethod,
        (path: string, handler: RequestHandler) => void
      > = {
        get: app.get.bind(app),
        post: app.post.bind(app),
        put: app.put.bind(app),
        patch: app.patch.bind(app),
        delete: app.delete.bind(app),
      };

      for (const def of endpoints) {
        const handler = wrapEndpoint(def, deps);
        addRoute[def.method](def.path ?? "", handler);
      }
    },
  };
}
