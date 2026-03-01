import type { RouteBuilder } from "./base.controller";
import { TodosController } from "../../modules/todos/todos.controller";

export function registerControllers(builder: RouteBuilder): void {
  new TodosController().mount(builder);
}
