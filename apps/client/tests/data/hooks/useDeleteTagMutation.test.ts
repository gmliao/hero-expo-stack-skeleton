import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { useDeleteTagMutation } from '@/data/hooks/useDeleteTagMutation'
import { queryKeys } from '@/data/queryKeys'

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

describe('useDeleteTagMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useMutation as jest.Mock).mockReturnValue({})
  })

  it('calls api.deleteTag with tagId and invalidates tags.all() and todos.all() on success', async () => {
    const invalidateQueries = jest.fn().mockResolvedValue(undefined)
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })

    useDeleteTagMutation()

    expect(useMutation).toHaveBeenCalledTimes(1)
    const [options] = (useMutation as jest.Mock).mock.calls[0]

    ;(api.deleteTag as jest.Mock).mockResolvedValue(undefined)
    await options.mutationFn('tag-1')
    expect(api.deleteTag).toHaveBeenCalledWith('tag-1')

    await options.onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.tags.all() })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.todos.all() })
  })

  it('error path propagates error from api', async () => {
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() })
    useDeleteTagMutation()
    const [options] = (useMutation as jest.Mock).mock.calls[0]

    ;(api.deleteTag as jest.Mock).mockRejectedValue(new Error('Delete failed'))

    await expect(options.mutationFn('tag-1')).rejects.toThrow('Delete failed')
  })
})
