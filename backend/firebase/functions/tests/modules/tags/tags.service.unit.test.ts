let mockTodoDocs: Array<{
  data: jest.Mock
  ref: { id: string }
}> = []
const mockCommit = jest.fn()
const mockBatchDelete = jest.fn()
const mockBatchUpdate = jest.fn()
const mockTodosWhere = jest.fn(() => ({
  get: jest.fn().mockImplementation(() =>
    Promise.resolve({ docs: mockTodoDocs }),
  ),
}))
const mockTodosCollection = jest.fn(() => ({
  where: mockTodosWhere,
}))
const mockTagDoc = { id: 'tag-1', path: 'users/user-1/tags/tag-1' }
const mockTagsNestedCollection = jest.fn(() => ({
  doc: jest.fn(() => mockTagDoc),
}))
const mockUsersDoc = jest.fn(() => ({
  collection: mockTagsNestedCollection,
}))
const mockUsersCollection = jest.fn(() => ({
  doc: mockUsersDoc,
}))
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn((name: string) => {
      if (name === 'todos') return mockTodosCollection()
      if (name === 'users') return mockUsersCollection()
      throw new Error(`Unexpected collection ${name}`)
    }),
    batch: jest.fn(() => ({
      delete: mockBatchDelete,
      update: mockBatchUpdate,
      commit: mockCommit,
    })),
  })),
  FieldValue: {
    arrayRemove: jest.fn((id: string) => ({ __arrayRemove: id })),
  },
  Timestamp: { now: jest.fn(() => ({})) },
}))

import { TagsService } from '../../../src/modules/tags/tags.service'
import { AppError } from '../../../src/core/http/errors'
import { createMockTagsRepository } from '../../mocks/tags.repository.mock'
import type { Tag } from '../../../src/types/api'

const baseTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 'tag-1',
  uid: 'user-1',
  name: 'Work',
  emoji: '🧰',
  colorToken: 'tagTeal',
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

describe('TagsService (unit)', () => {
  afterEach(() => {
    mockTodoDocs = []
    mockCommit.mockReset().mockResolvedValue(undefined)
    mockBatchDelete.mockReset()
    mockBatchUpdate.mockReset()
    mockTodosWhere.mockClear()
    mockTodosCollection.mockClear()
    mockUsersDoc.mockClear()
    mockUsersCollection.mockClear()
    mockTagsNestedCollection.mockClear()
  })

  describe('list', () => {
    it('returns tags for the user', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      const result = await svc.list('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe('user-1')
    })
  })

  describe('create', () => {
    it('creates and returns tag with trimmed name, emoji, and colorToken', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      const result = await svc.create('user-1', {
        name: '  New Tag  ',
        emoji: '🏠',
        colorToken: 'tagBlue',
      })
      expect(result.uid).toBe('user-1')
      expect(result.name).toBe('New Tag')
      expect(result.emoji).toBe('🏠')
      expect(result.colorToken).toBe('tagBlue')
    })

    it('throws VALIDATION_ERROR when name is empty', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      await expect(
        svc.create('user-1', { name: '', emoji: '🏠', colorToken: 'tagBlue' }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })

    it('throws VALIDATION_ERROR when name is only whitespace', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      await expect(
        svc.create('user-1', { name: '   ', emoji: '🏠', colorToken: 'tagBlue' }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })

    it('throws VALIDATION_ERROR when emoji is empty', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      await expect(
        svc.create('user-1', { name: 'Work', emoji: '   ', colorToken: 'tagBlue' }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })
  })

  describe('update', () => {
    it('throws NOT_FOUND when tag does not exist', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      await expect(
        svc.update('nope', 'user-1', { name: 'x', emoji: '⚡', colorToken: 'tagAmber' }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('updates and returns full tag payload when found', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      const result = await svc.update('tag-1', 'user-1', {
        name: '  Updated  ',
        emoji: '📚',
        colorToken: 'tagGreen',
      })
      expect(result.name).toBe('Updated')
      expect(result.emoji).toBe('📚')
      expect(result.colorToken).toBe('tagGreen')
    })

    it('throws VALIDATION_ERROR when name is empty after trim', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      await expect(
        svc.update('tag-1', 'user-1', { name: '   ', emoji: '📚', colorToken: 'tagGreen' }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })

    it('throws VALIDATION_ERROR when emoji is empty after trim', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      await expect(
        svc.update('tag-1', 'user-1', { name: 'Updated', emoji: ' ', colorToken: 'tagGreen' }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })

    it('throws NOT_FOUND when repo.update returns null', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const updateSpy = jest.spyOn(repo, 'update').mockResolvedValueOnce(null)
      const svc = new TagsService(repo)
      await expect(
        svc.update('tag-1', 'user-1', {
          name: 'Updated',
          emoji: '📚',
          colorToken: 'tagGreen',
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
      updateSpy.mockRestore()
    })
  })

  describe('delete', () => {
    it('throws NOT_FOUND when tag does not exist', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      await expect(svc.delete('nope', 'user-1')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('deletes successfully when tag exists', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      await expect(svc.delete('tag-1', 'user-1')).resolves.toBeUndefined()
      expect(mockBatchDelete).toHaveBeenCalledWith(mockTagDoc)
      expect(mockCommit).toHaveBeenCalledTimes(1)
    })

    it('after deleting tag, removes tagId from all todos that reference it', async () => {
      const matchingDoc = { id: 'todo-1' }
      const otherDoc = { id: 'todo-2' }
      mockTodoDocs = [
        {
          data: jest.fn(() => ({ tagIds: ['tag-1', 'tag-2'] })),
          ref: matchingDoc,
        },
        {
          data: jest.fn(() => ({ tagIds: ['tag-2'] })),
          ref: otherDoc,
        },
      ]
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      await svc.delete('tag-1', 'user-1')
      expect(mockBatchUpdate).toHaveBeenCalledTimes(1)
      expect(mockBatchUpdate).toHaveBeenCalledWith(
        matchingDoc,
        expect.objectContaining({
          tagIds: expect.anything(),
          updatedAt: expect.anything(),
        }),
      )
      expect(mockBatchUpdate).not.toHaveBeenCalledWith(
        otherDoc,
        expect.anything(),
      )
      mockTodoDocs = []
    })

    it('scopes todo cleanup query to the deleting uid', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      await svc.delete('tag-1', 'user-1')
      expect(mockTodosWhere).toHaveBeenCalledWith('uid', '==', 'user-1')
    })
  })
})
