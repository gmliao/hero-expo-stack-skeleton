import type { Deps } from "./deps.types";
import type { Logger } from "./http/types";
import { FirebaseAuthVerifier } from "../infrastructure/auth/auth.firebase.service";
import { TodosFirestoreRepository } from "../modules/todos/todos.firestore.repository";
import { TodosService } from "../modules/todos/todos.service";
import { TagsFirestoreRepository } from "../modules/tags/tags.firestore.repository";
import { TagsService } from "../modules/tags/tags.service";

class ConsoleLogger implements Logger {
  info(msg: string, extra?: unknown) {
    console.log(msg, extra ?? "");
  }
  warn(msg: string, extra?: unknown) {
    console.warn(msg, extra ?? "");
  }
  error(msg: string, extra?: unknown) {
    console.error(msg, extra ?? "");
  }
}

export function createDeps(): Deps {
  const todosRepo = new TodosFirestoreRepository();
  const tagsRepo = new TagsFirestoreRepository();
  return {
    services: {
      todos: new TodosService(todosRepo),
      tags: new TagsService(tagsRepo),
    },
    auth: new FirebaseAuthVerifier(),
    logger: new ConsoleLogger(),
  };
}
