import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/data/api'
import { useCreateTagMutation } from '@/data/hooks/useCreateTagMutation'
import { queryKeys } from '@/data/queryKeys'

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

jest.mock('@/data/api', () => ({
  api: {
    createTag: jest.fn(),
  },
}))

describe('useCreateTagMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useMutation as jest.Mock).mockReturnValue({})
  })

  it('calls api.createTag with body and invalidates tags.all() on success', async () => {
    const invalidateQueries = jest.fn().mockResolvedValue(undefined)
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries })

    useCreateTagMutation()

    expect(useMutation).toHaveBeenCalledTimes(1)
    const [options] = (useMutation as jest.Mock).mock.calls[0]

    ;(api.createTag as jest.Mock).mockResolvedValue({
      id: 'tag-1',
      name: 'Work',
      emoji: '🧰',
      colorToken: 'tagTeal',
      uid: 'u1',
      createdAt: '',
      updatedAt: '',
    })
    await options.mutationFn({ name: 'Work', emoji: '🧰', colorToken: 'tagTeal' })
    expect(api.createTag).toHaveBeenCalledWith({ name: 'Work', emoji: '🧰', colorToken: 'tagTeal' })

    await options.onSuccess()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.tags.all() })
  })

  it('error path propagates error from api', async () => {
    ;(useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() })
    useCreateTagMutation()
    const [options] = (useMutation as jest.Mock).mock.calls[0]

    ;(api.createTag as jest.Mock).mockRejectedValue(new Error('Create failed'))

    await expect(options.mutationFn({ name: 'X', emoji: '⚡', colorToken: 'tagAmber' })).rejects.toThrow('Create failed')
  })
})
