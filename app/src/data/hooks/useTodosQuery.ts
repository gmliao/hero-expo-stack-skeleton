import { useQuery } from '@tanstack/react-query'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useTodosQuery = (uid: string) => {
  return useQuery({
    queryKey: queryKeys.todos.list(uid),
    queryFn: () => api.getTodos(uid),
    enabled: Boolean(uid),
  })
}
