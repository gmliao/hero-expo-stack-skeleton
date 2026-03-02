export const queryKeys = {
  todos: {
    all: () => ['todos'] as const,
    lists: () => ['todos', 'list'] as const,
    list: (uid: string, filter: string = 'all', selectedTagId?: string | null) =>
      selectedTagId !== undefined
        ? (['todos', 'list', { uid, filter, selectedTagId }] as const)
        : (['todos', 'list', { uid, filter }] as const),
    details: () => ['todos', 'detail'] as const,
    detail: (id: string) => ['todos', 'detail', id] as const,
  },
  profile: {
    all: () => ['profile'] as const,
    current: (uid: string) => ['profile', 'current', uid] as const,
  },
  tags: {
    all: () => ['tags'] as const,
    list: (uid: string) => ['tags', 'list', { uid }] as const,
  },
} as const
