import type { IAuthVerifier } from "../infrastructure/auth/auth.types";
import type { ITodosService } from "../modules/todos/todos.types";
import type { ITagsService } from "../modules/tags/tags.types";
import type { Logger } from "./http/types";

export interface DepsServices {
  todos: ITodosService;
  tags: ITagsService;
}

export interface Deps {
  services: DepsServices;
  auth: IAuthVerifier;
  logger: Logger;
}
