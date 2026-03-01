import type { Deps } from "../../src/http/endpoint";

/**
 * Creates a mock `Deps` object for unit tests.
 *
 * **Shallow merge warning:** `overrides` is spread at the top level.
 * Passing `{ services: { todos: { listTodos: fn } } }` replaces the
 * entire `services` object — all other `todos` methods become the mock
 * defaults only if you include them. To override a single method on
 * `services.todos`, spread the existing mock manually:
 *
 * ```ts
 * const deps = createMockDeps();
 * (deps.services.todos.listTodos as jest.Mock).mockRejectedValue(new Error());
 * ```
 */
export function createMockDeps(overrides: Partial<Deps> = {}): Deps {
  return {
    services: {
      todos: {
        listTodos: jest.fn().mockResolvedValue([]),
        createTodo: jest.fn().mockResolvedValue({}),
        updateTodo: jest.fn().mockResolvedValue({}),
        toggleTodo: jest.fn().mockResolvedValue({}),
        deleteTodo: jest.fn().mockResolvedValue(undefined),
      },
    },
    auth: {
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: "test-uid",
        email: "test@example.com",
      }),
    },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    ...overrides,
  };
}
