import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateTagRequest } from '@shared/types/api'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useCreateTagMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateTagRequest) => api.createTag(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.all() })
    },
  })
}
