import { z } from "zod";
import { BaseController } from "./base.controller";
import { defineEndpoint } from "../http/endpoint";
import { createTodoSchema, updateTodoSchema } from "../schemas/todos.schema";
import type { CreateTodoInput, UpdateTodoInput } from "../services/todos.service";

const idParams = z.object({ id: z.string().min(1) });

export class TodosController extends BaseController {
  readonly prefix = "/todos";

  endpoints() {
    return [
      defineEndpoint({
        id: "todos.list",
        method: "get",
        path: "",
        auth: true,
        execute: ({ deps, ctx }) =>
          deps.services.todos.listTodos(ctx.uid!),
      }),
      defineEndpoint({
        id: "todos.create",
        method: "post",
        path: "",
        auth: true,
        schemas: { body: createTodoSchema },
        execute: ({ deps, ctx, input }) =>
          deps.services.todos.createTodo(
            ctx.uid!,
            input.body as CreateTodoInput,
          ),
      }),
      defineEndpoint({
        id: "todos.update",
        method: "patch",
        path: "/:id",
        auth: true,
        schemas: { body: updateTodoSchema, params: idParams },
        execute: ({ deps, ctx, input }) =>
          deps.services.todos.updateTodo(
            ctx.uid!,
            (input.params as { id: string }).id,
            input.body as UpdateTodoInput,
          ),
      }),
      defineEndpoint({
        id: "todos.toggle",
        method: "patch",
        path: "/:id/toggle",
        auth: true,
        schemas: { params: idParams },
        execute: ({ deps, ctx, input }) =>
          deps.services.todos.toggleTodo(
            ctx.uid!,
            (input.params as { id: string }).id,
          ),
      }),
      defineEndpoint({
        id: "todos.delete",
        method: "delete",
        path: "/:id",
        auth: true,
        schemas: { params: idParams },
        execute: async ({ deps, ctx, input }) => {
          await deps.services.todos.deleteTodo(
            ctx.uid!,
            (input.params as { id: string }).id,
          );
          return null;
        },
      }),
    ];
  }
}
