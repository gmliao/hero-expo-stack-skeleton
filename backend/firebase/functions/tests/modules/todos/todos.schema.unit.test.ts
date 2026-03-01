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
  })
})
