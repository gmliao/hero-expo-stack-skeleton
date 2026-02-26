import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useToggleTodoMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.toggleTodo(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() })
    },
  })
}
