import { useQuery } from '@tanstack/react-query'

import { api } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

export const useTagsQuery = (uid: string) => {
  return useQuery({
    queryKey: queryKeys.tags.list(uid),
    queryFn: () => api.getTags(),
    enabled: Boolean(uid),
  })
}
