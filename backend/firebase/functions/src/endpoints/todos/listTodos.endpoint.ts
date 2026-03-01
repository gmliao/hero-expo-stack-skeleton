import { defineEndpoint } from "../../http/endpoint";

export const listTodosEndpoint = defineEndpoint({
  id: "todos.list",
  method: "get",
  path: "/todos",
  auth: true,
  execute: async ({ deps, ctx }) => {
    return deps.todosService.listTodos(ctx.uid!);
  },
});
