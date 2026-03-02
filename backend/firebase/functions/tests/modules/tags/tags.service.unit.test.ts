import { TagsService } from '../../../src/modules/tags/tags.service'
import { AppError } from '../../../src/core/http/errors'
import { createMockTagsRepository } from '../../mocks/tags.repository.mock'
import type { Tag } from '../../../src/types/api'

const baseTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 'tag-1',
  uid: 'user-1',
  name: 'Work',
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

describe('TagsService (unit)', () => {
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
    it('creates and returns tag with trimmed name', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      const result = await svc.create('user-1', '  New Tag  ')
      expect(result.uid).toBe('user-1')
      expect(result.name).toBe('New Tag')
    })

    it('throws VALIDATION_ERROR when name is empty', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      await expect(svc.create('user-1', '')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })

    it('throws VALIDATION_ERROR when name is only whitespace', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      await expect(svc.create('user-1', '   ')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })
  })

  describe('update', () => {
    it('throws NOT_FOUND when tag does not exist', async () => {
      const repo = createMockTagsRepository()
      const svc = new TagsService(repo)
      await expect(svc.update('nope', 'user-1', 'x')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('updates and returns tag when found', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      const result = await svc.update('tag-1', 'user-1', '  Updated  ')
      expect(result.name).toBe('Updated')
    })

    it('throws VALIDATION_ERROR when name is empty after trim', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const svc = new TagsService(repo)
      await expect(svc.update('tag-1', 'user-1', '   ')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })

    it('throws NOT_FOUND when repo.update returns null', async () => {
      const repo = createMockTagsRepository({ tags: [baseTag()] })
      const updateSpy = jest.spyOn(repo, 'update').mockResolvedValueOnce(null)
      const svc = new TagsService(repo)
      await expect(svc.update('tag-1', 'user-1', 'Updated')).rejects.toMatchObject({
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
    })
  })
})
