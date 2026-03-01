import { defineEndpoint } from "../../http/endpoint";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const toggleTodoEndpoint = defineEndpoint({
  id: "todos.toggle",
  method: "patch",
  path: "/todos/:id/toggle",
  auth: true,
  schemas: { params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const params = input.params as { id: string };
    return deps.services.todos.toggleTodo(ctx.uid!, params.id);
  },
});
