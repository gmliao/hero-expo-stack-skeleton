import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { useUpdateTagMutation } from '@/data/hooks/useUpdateTagMutation'
import { queryKeys } from '@/data/queryKeys'

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

jest.mock('@/data/api', () => ({
  api: {
    updateTag: jest.fn(),
  },
}))

describe('useUpdateTagMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useMutation as jest.Mock).mockReturnValue({})
  })

  it('calls api.updateTag with tagId and body and invalidates tags.all() on success', async () => {
    const invalidateQueries = jest.fn().mockResolvedValue(undefined)
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })

    useUpdateTagMutation()

    expect(useMutation).toHaveBeenCalledTimes(1)
    const [options] = (useMutation as jest.Mock).mock.calls[0]

    ;(api.updateTag as jest.Mock).mockResolvedValue({
      id: 'tag-1',
      name: 'Updated',
      uid: 'u1',
      createdAt: '',
      updatedAt: '',
    })
    await options.mutationFn({ tagId: 'tag-1', body: { name: 'Updated' } })
    expect(api.updateTag).toHaveBeenCalledWith('tag-1', { name: 'Updated' })

    await options.onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.tags.all() })
  })

  it('error path propagates error from api', async () => {
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() })
    useUpdateTagMutation()
    const [options] = (useMutation as jest.Mock).mock.calls[0]

    ;(api.updateTag as jest.Mock).mockRejectedValue(new Error('Update failed'))

    await expect(options.mutationFn({ tagId: 'tag-1', body: { name: 'X' } })).rejects.toThrow('Update failed')
  })
})
