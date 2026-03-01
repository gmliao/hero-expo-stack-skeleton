import { defineEndpoint } from "../../http/endpoint";
import { AppError } from "../../http/errors";
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
    const todo = await deps.todosRepo.toggle(params.id, ctx.uid!);
    if (!todo) {
      const existing = await deps.todosRepo.findById(params.id);
      if (!existing) throw new AppError("NOT_FOUND", "Todo not found");
      throw new AppError("FORBIDDEN", "Forbidden");
    }
    return todo;
  },
});
