import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateTagRequest } from '@shared/types/api'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useUpdateTagMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tagId, body }: { tagId: string; body: UpdateTagRequest }) =>
      api.updateTag(tagId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.all() })
    },
  })
}
