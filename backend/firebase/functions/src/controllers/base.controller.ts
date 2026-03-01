import type { EndpointDef } from "../http/endpoint";
import type { createRouteBuilder } from "../http/builder";

export type RouteBuilder = ReturnType<typeof createRouteBuilder>;

export abstract class BaseController {
  abstract readonly prefix: string;
  abstract endpoints(): EndpointDef[];

  mount(builder: RouteBuilder): void {
    for (const def of this.endpoints()) {
      builder.add({ ...def, path: this.prefix + def.path });
    }
  }
}
