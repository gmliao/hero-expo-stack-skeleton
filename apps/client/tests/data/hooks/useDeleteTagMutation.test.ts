import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { useDeleteTagMutation } from '@/data/hooks/useDeleteTagMutation'
import { queryKeys } from '@/data/queryKeys'
import { useUIStore } from '@/stores/useUIStore'

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

jest.mock('@/data/api', () => ({
  api: {
    deleteTag: jest.fn(),
  },
}))

jest.mock('@/stores/useUIStore', () => ({
  useUIStore: {
    getState: jest.fn(),
  },
}))

describe('useDeleteTagMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useMutation as jest.Mock).mockReturnValue({})
  })

  it('calls api.deleteTag with tagId and invalidates tags.all() and todos.all() on success', async () => {
    const invalidateQueries = jest.fn().mockResolvedValue(undefined)
    const setSelectedTagId = jest.fn()
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })
    ;(useUIStore.getState as jest.Mock).mockReturnValue({
      selectedTagId: null,
      setSelectedTagId,
    })

    useDeleteTagMutation()

    expect(useMutation).toHaveBeenCalledTimes(1)
    const [options] = (useMutation as jest.Mock).mock.calls[0]

    ;(api.deleteTag as jest.Mock).mockResolvedValue(undefined)
    await options.mutationFn('tag-1')
    expect(api.deleteTag).toHaveBeenCalledWith('tag-1')

    await options.onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.tags.all() })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.todos.all() })
    expect(setSelectedTagId).not.toHaveBeenCalled()
  })

  it('error path propagates error from api', async () => {
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() })
    ;(useUIStore.getState as jest.Mock).mockReturnValue({
      selectedTagId: null,
      setSelectedTagId: jest.fn(),
    })
    useDeleteTagMutation()
    const [options] = (useMutation as jest.Mock).mock.calls[0]

    ;(api.deleteTag as jest.Mock).mockRejectedValue(new Error('Delete failed'))

    await expect(options.mutationFn('tag-1')).rejects.toThrow('Delete failed')
  })

  it('clears selectedTagId when deleting the active tag filter', async () => {
    const invalidateQueries = jest.fn().mockResolvedValue(undefined)
    const setSelectedTagId = jest.fn()
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })
    ;(useUIStore.getState as jest.Mock).mockReturnValue({
      selectedTagId: 'tag-1',
      setSelectedTagId,
    })

    useDeleteTagMutation()

    const [options] = (useMutation as jest.Mock).mock.calls[0]
    await options.onSuccess(undefined, 'tag-1')

    expect(setSelectedTagId).toHaveBeenCalledWith(null)
  })
})
