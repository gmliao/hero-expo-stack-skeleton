import {
  createTagBodySchema,
  updateTagBodySchema,
  tagIdParamsSchema,
} from '../../../src/modules/tags/tags.schema'

describe('tags.schema (unit)', () => {
  describe('createTagBodySchema', () => {
    it('accepts valid name', () => {
      expect(createTagBodySchema.parse({ name: 'work' })).toEqual({ name: 'work' })
      expect(createTagBodySchema.parse({ name: 'a'.repeat(50) })).toEqual({
        name: 'a'.repeat(50),
      })
    })

    it('rejects empty name', () => {
      expect(() => createTagBodySchema.parse({ name: '' })).toThrow('name is required')
    })

    it('rejects name over 50 chars', () => {
      expect(() => createTagBodySchema.parse({ name: 'a'.repeat(51) })).toThrow(
        'name max 50 characters',
      )
    })
  })

  describe('updateTagBodySchema', () => {
    it('accepts valid name', () => {
      expect(updateTagBodySchema.parse({ name: 'updated' })).toEqual({ name: 'updated' })
    })

    it('rejects empty name', () => {
      expect(() => updateTagBodySchema.parse({ name: '' })).toThrow('name is required')
    })
  })

  describe('tagIdParamsSchema', () => {
    it('accepts non-empty tagId', () => {
      expect(tagIdParamsSchema.parse({ tagId: 'abc123' })).toEqual({ tagId: 'abc123' })
    })

    it('rejects empty tagId', () => {
      expect(() => tagIdParamsSchema.parse({ tagId: '' })).toThrow('tagId is required')
    })
  })
})
