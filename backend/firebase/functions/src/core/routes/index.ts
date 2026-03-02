import type { RouteBuilder } from "./base.controller";
import { TodosController } from "../../modules/todos/todos.controller";
import { TagsController } from "../../modules/tags/tags.controller";

export function registerControllers(builder: RouteBuilder): void {
  new TodosController().mount(builder);
  new TagsController().mount(builder);
}
