import type { IAuthVerifier } from "../infrastructure/auth/auth.types";
import type { ITodosService } from "../modules/todos/todos.types";
import type { Logger } from "./http/types";

export interface DepsServices {
  todos: ITodosService;
}

export interface Deps {
  services: DepsServices;
  auth: IAuthVerifier;
  logger: Logger;
}
