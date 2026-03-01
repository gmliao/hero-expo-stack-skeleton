import { defineEndpoint } from "../../http/endpoint";
import { AppError } from "../../http/errors";
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
    const existing = await deps.todosRepo.findById(params.id);
    if (!existing) throw new AppError("NOT_FOUND", "Todo not found");
    if (existing.uid !== ctx.uid) throw new AppError("FORBIDDEN", "Forbidden");
    await deps.todosRepo.delete(params.id);
    return null;
  },
});
