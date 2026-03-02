import type { Todo } from '@shared/types/api'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'
import type { Filter } from '@/stores/useUIStore'

export function filterAndSortTodos(todos: Todo[], filter: Filter): Todo[] {
  const filtered =
    filter === 'all'
      ? todos
      : filter === 'active'
        ? todos.filter(t => !t.completed)
        : todos.filter(t => t.completed)
  return [...filtered].sort((a, b) => {
    const aDue = a.dueDate ?? ''
    const bDue = b.dueDate ?? ''
    return aDue.localeCompare(bDue)
  })
}

export const useTodosQuery = (
  uid: string,
  filter: Filter = 'all',
  selectedTagId?: string | null,
) => {
  return useQuery({
    queryKey: queryKeys.todos.list(uid, filter, selectedTagId),
    queryFn: () => api.getTodos(uid),
    select: (data) => {
      let result = filterAndSortTodos(data, filter)
      if (selectedTagId != null) {
        result = result.filter(t => (t.tagIds ?? []).includes(selectedTagId))
      }
      return result
    },
    enabled: Boolean(uid),
  })
}
