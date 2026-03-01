import type { createRouteBuilder } from "../http/builder";
import { createTodoEndpoint } from "../endpoints/todos/createTodo.endpoint";
import { listTodosEndpoint } from "../endpoints/todos/listTodos.endpoint";
import { updateTodoEndpoint } from "../endpoints/todos/updateTodo.endpoint";
import { toggleTodoEndpoint } from "../endpoints/todos/toggleTodo.endpoint";
import { deleteTodoEndpoint } from "../endpoints/todos/deleteTodo.endpoint";

export function registerEndpoints(
  builder: ReturnType<typeof createRouteBuilder>,
) {
  builder
    .add(createTodoEndpoint)
    .add(listTodosEndpoint)
    .add(updateTodoEndpoint)
    .add(toggleTodoEndpoint)
    .add(deleteTodoEndpoint);
}
