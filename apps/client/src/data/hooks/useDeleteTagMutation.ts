import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'
import { useUIStore } from '@/stores/useUIStore'

export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tagId: string) => api.deleteTag(tagId),
    onSuccess: async (_data, tagId) => {
      const { selectedTagId, setSelectedTagId } = useUIStore.getState()
      if (selectedTagId === tagId) {
        setSelectedTagId(null)
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos.all() })
    },
  })
}
