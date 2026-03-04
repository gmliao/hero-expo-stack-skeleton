import {
  createTagBodySchema,
  updateTagBodySchema,
  tagIdParamsSchema,
} from '../../../src/modules/tags/tags.schema'

describe('tags.schema (unit)', () => {
  describe('createTagBodySchema', () => {
    it('accepts valid name, emoji, and colorToken', () => {
      expect(
        createTagBodySchema.parse({ name: 'work', emoji: '🧰', colorToken: 'tagTeal' }),
      ).toEqual({ name: 'work', emoji: '🧰', colorToken: 'tagTeal' })
      expect(createTagBodySchema.parse({ name: 'a'.repeat(50), emoji: '📚', colorToken: 'tagBlue' })).toEqual({
        name: 'a'.repeat(50),
        emoji: '📚',
        colorToken: 'tagBlue',
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

    it('rejects empty emoji', () => {
      expect(() => createTagBodySchema.parse({ name: 'work', emoji: '', colorToken: 'tagTeal' })).toThrow()
    })

    it('rejects unsupported color token', () => {
      expect(() =>
        createTagBodySchema.parse({ name: 'work', emoji: '🧰', colorToken: 'purple' }),
      ).toThrow()
    })
  })

  describe('updateTagBodySchema', () => {
    it('accepts valid full payload', () => {
      expect(
        updateTagBodySchema.parse({ name: 'updated', emoji: '⚡', colorToken: 'tagAmber' }),
      ).toEqual({ name: 'updated', emoji: '⚡', colorToken: 'tagAmber' })
    })

    it('rejects empty name', () => {
      expect(() => updateTagBodySchema.parse({ name: '' })).toThrow('name is required')
    })

    it('rejects empty emoji', () => {
      expect(() =>
        updateTagBodySchema.parse({ name: 'updated', emoji: '', colorToken: 'tagTeal' }),
      ).toThrow()
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
