import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useDeleteTodoMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteTodo(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() })
    },
  })
}
