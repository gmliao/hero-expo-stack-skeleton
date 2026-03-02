import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tagId: string) => api.deleteTag(tagId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos.all() })
    },
  })
}
