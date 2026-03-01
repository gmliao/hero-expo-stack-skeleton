import type { Deps, Logger } from "./http/endpoint";
import { TodosFirestoreRepository } from "./repositories/todos.firestore.repository";
import { TodosService } from "./services/todos.service";
import { FirebaseAuthVerifier } from "./services/auth.firebase.service";

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
  return {
    todosService: new TodosService(todosRepo),
    auth: new FirebaseAuthVerifier(),
    logger: new ConsoleLogger(),
  };
}
