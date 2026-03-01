import { defineEndpoint } from "../../http/endpoint";
import { updateTodoSchema } from "../../schemas/todos.schema";
import { z } from "zod";
import type { UpdateTodoInput } from "../../services/todos.service";

const paramsSchema = z.object({ id: z.string().min(1) });

export const updateTodoEndpoint = defineEndpoint({
  id: "todos.update",
  method: "patch",
  path: "/todos/:id",
  auth: true,
  schemas: { body: updateTodoSchema, params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const params = input.params as { id: string };
    const body = input.body as UpdateTodoInput;
    return deps.todosService.updateTodo(ctx.uid!, params.id, body);
  },
});
