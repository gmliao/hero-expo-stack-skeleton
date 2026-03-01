import type { Deps, Logger } from "./http/endpoint";
import { TodosFirestoreRepository } from "./repositories/todos.firestore.repository";
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
  return {
    todosRepo: new TodosFirestoreRepository(),
    auth: new FirebaseAuthVerifier(),
    logger: new ConsoleLogger(),
  };
}
