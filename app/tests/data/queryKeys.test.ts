import { queryKeys } from '@/data/queryKeys'

describe('queryKeys factory', () => {
  it('todos.all() is stable across calls', () => {
    expect(queryKeys.todos.all()).toEqual(queryKeys.todos.all())
    expect(JSON.stringify(queryKeys.todos.all())).toBe(JSON.stringify(queryKeys.todos.all()))
  })

  it('todos.list(uid, filter) is deterministic', () => {
    const first = queryKeys.todos.list('uid-1', 'active')
    const second = queryKeys.todos.list('uid-1', 'active')

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('todos.list with different filters produce different keys', () => {
    const active = queryKeys.todos.list('uid-1', 'active')
    const all = queryKeys.todos.list('uid-1', 'all')

    expect(JSON.stringify(active)).not.toBe(JSON.stringify(all))
  })

  it('todos.list(uid, filter) same input produces same serialized key for all filter values', () => {
    const uid = 'user-42'
    const filters: Array<'all' | 'active' | 'completed'> = ['all', 'active', 'completed']

    for (const filter of filters) {
      const first = queryKeys.todos.list(uid, filter)
      const second = queryKeys.todos.list(uid, filter)
      expect(JSON.stringify(first)).toBe(JSON.stringify(second))
      expect(first).toEqual(['todos', 'list', { uid, filter }])
    }
  })

  it('todos.lists() is a prefix of todos.list()', () => {
    const lists = queryKeys.todos.lists()
    const list = queryKeys.todos.list('uid-1', 'all')

    expect(list.slice(0, lists.length)).toEqual(lists)
  })

  it('no key contains undefined or null', () => {
    const serialized = JSON.stringify(queryKeys.todos.list('uid-1', 'all'))

    expect(serialized).not.toContain('null')
    expect(serialized).not.toContain('undefined')
  })
})
