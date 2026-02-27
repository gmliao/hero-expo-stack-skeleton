import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateTodoRequest } from '@shared/types/api'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useCreateTodoMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateTodoRequest) => api.createTodo(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() })
    },
  })
}
