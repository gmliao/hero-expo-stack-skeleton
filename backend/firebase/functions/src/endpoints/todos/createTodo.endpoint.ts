import { defineEndpoint } from "../../http/endpoint";
import { createTodoSchema } from "../../schemas/todos.schema";
import type { CreateTodoInput } from "../../services/todos.service";

export const createTodoEndpoint = defineEndpoint({
  id: "todos.create",
  method: "post",
  path: "/todos",
  auth: true,
  schemas: { body: createTodoSchema },
  execute: async ({ deps, ctx, input }) => {
    const body = input.body as CreateTodoInput;
    return deps.services.todos.createTodo(ctx.uid!, body);
  },
});
