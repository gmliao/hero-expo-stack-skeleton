import { BaseController } from "../../core/routes/base.controller";
import { defineEndpoint } from "../../core/http/endpoint";
import {
  createTagBodySchema,
  updateTagBodySchema,
  tagIdParamsSchema,
} from "./tags.schema";

export class TagsController extends BaseController {
  readonly prefix = "/tags";

  endpoints() {
    return [
      defineEndpoint({
        id: "tags.list",
        method: "get",
        execute: ({ deps, ctx }) => deps.services.tags.list(ctx.uid!),
      }),
      defineEndpoint({
        id: "tags.create",
        method: "post",
        successStatus: 201,
        schemas: { body: createTagBodySchema },
        execute: ({ deps, ctx, input }) =>
          deps.services.tags.create(ctx.uid!, input.body),
      }),
      defineEndpoint({
        id: "tags.update",
        method: "patch",
        path: "/:tagId",
        schemas: { body: updateTagBodySchema, params: tagIdParamsSchema },
        execute: ({ deps, ctx, input }) =>
          deps.services.tags.update(
            input.params.tagId,
            ctx.uid!,
            input.body,
          ),
      }),
      defineEndpoint({
        id: "tags.delete",
        method: "delete",
        path: "/:tagId",
        successStatus: 204,
        schemas: { params: tagIdParamsSchema },
        execute: async ({ deps, ctx, input }) => {
          await deps.services.tags.delete(input.params.tagId, ctx.uid!);
          return null;
        },
      }),
    ];
  }
}
