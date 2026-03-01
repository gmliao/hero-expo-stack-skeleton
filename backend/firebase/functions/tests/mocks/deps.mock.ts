import type { Deps } from "../../src/http/endpoint";

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
