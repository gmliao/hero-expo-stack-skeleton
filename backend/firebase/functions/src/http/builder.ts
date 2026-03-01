import type { Express } from "express";
import type { Deps, EndpointDef } from "./endpoint";
import { wrapEndpoint } from "./wrap";

export function createRouteBuilder(deps: Deps) {
  const endpoints: EndpointDef[] = [];

  return {
    add(def: EndpointDef) {
      endpoints.push(def);
      return this;
    },

    mount(app: Express) {
      for (const def of endpoints) {
        const handler = wrapEndpoint(def, deps);
        (app as any)[def.method](def.path, handler);
      }
    },
  };
}
