import { defineEndpoint } from "../../http/endpoint";
import { createTodoSchema } from "../../schemas/todos.schema";

export const createTodoEndpoint = defineEndpoint({
  id: "todos.create",
  method: "post",
  path: "/todos",
  auth: true,
  schemas: { body: createTodoSchema },
  execute: async ({ deps, ctx, input }) => {
    return deps.todosRepo.create(ctx.uid!, {
      title: (input.body as { title: string; description?: string; dueDate?: string }).title,
      description: (input.body as { title: string; description?: string; dueDate?: string }).description,
      dueDate: (input.body as { title: string; description?: string; dueDate?: string }).dueDate,
    });
  },
});
