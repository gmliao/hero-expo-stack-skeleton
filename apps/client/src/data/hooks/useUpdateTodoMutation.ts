import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateTodoRequest } from '@shared/types/api'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useUpdateTodoMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateTodoRequest) =>
      api.updateTodo(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() })
    },
  })
}
