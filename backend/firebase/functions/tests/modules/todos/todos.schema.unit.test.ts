import { createTodoSchema, updateTodoSchema } from '../../../src/modules/todos/todos.schema'

describe('todos.schema (unit)', () => {
  describe('createTodoSchema', () => {
    it('trims title and normalizes empty dueDate to undefined', () => {
      expect(
        createTodoSchema.parse({
          title: '  Buy milk  ',
          dueDate: '   ',
        }),
      ).toEqual({
        title: 'Buy milk',
        description: '',
        dueDate: undefined,
      })
    })

    it('rejects empty title after trimming', () => {
      expect(() =>
        createTodoSchema.parse({
          title: '   ',
        }),
      ).toThrow('title is required')
    })

    it('accepts optional tagIds array of non-empty strings', () => {
      expect(
        createTodoSchema.parse({
          title: 'T',
          tagIds: ['id1', 'id2'],
        }),
      ).toMatchObject({ title: 'T', tagIds: ['id1', 'id2'] })
    })
  })

  describe('updateTodoSchema', () => {
    it('trims title and preserves nullable dueDate', () => {
      expect(
        updateTodoSchema.parse({
          title: '  Updated  ',
          dueDate: null,
        }),
      ).toEqual({
        title: 'Updated',
        dueDate: null,
      })
    })

    it('rejects empty title after trimming', () => {
      expect(() =>
        updateTodoSchema.parse({
          title: '   ',
        }),
      ).toThrow('title cannot be empty')
    })

    it('accepts optional tagIds array', () => {
      expect(
        updateTodoSchema.parse({
          tagIds: ['a', 'b'],
        }),
      ).toMatchObject({ tagIds: ['a', 'b'] })
    })
  })
})
