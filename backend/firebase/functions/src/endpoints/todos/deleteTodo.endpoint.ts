import { defineEndpoint } from "../../http/endpoint";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const deleteTodoEndpoint = defineEndpoint({
  id: "todos.delete",
  method: "delete",
  path: "/todos/:id",
  auth: true,
  schemas: { params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const params = input.params as { id: string };
    await deps.todosService.deleteTodo(ctx.uid!, params.id);
    return null;
  },
});
