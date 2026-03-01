import type { RouteBuilder } from "../controllers/base.controller";
import { TodosController } from "../controllers/todos.controller";

export function registerControllers(builder: RouteBuilder): void {
  new TodosController().mount(builder);
}
