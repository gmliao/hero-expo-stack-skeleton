import { defineEndpoint } from "../../http/endpoint";
import { updateTodoSchema } from "../../schemas/todos.schema";
import { AppError } from "../../http/errors";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const updateTodoEndpoint = defineEndpoint({
  id: "todos.update",
  method: "patch",
  path: "/todos/:id",
  auth: true,
  schemas: { body: updateTodoSchema, params: paramsSchema },
  execute: async ({ deps, ctx, input }) => {
    const params = input.params as { id: string };
    const existing = await deps.todosRepo.findById(params.id);
    if (!existing) throw new AppError("NOT_FOUND", "Todo not found");
    if (existing.uid !== ctx.uid) throw new AppError("FORBIDDEN", "Forbidden");
    const updated = await deps.todosRepo.update(params.id, input.body as Record<string, unknown>);
    if (!updated) throw new AppError("NOT_FOUND", "Todo not found");
    return updated;
  },
});
