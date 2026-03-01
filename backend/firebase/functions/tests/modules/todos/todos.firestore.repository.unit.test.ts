const DELETE_SENTINEL = Symbol('field-delete')

type StoredDoc = Record<string, unknown>

const store = new Map<string, StoredDoc>()
let autoIdCounter = 0

function makeTimestamp(iso: string) {
  return {
    toDate: () => new Date(iso),
  }
}

function cloneStoredDoc(data: StoredDoc): StoredDoc {
  return { ...data }
}

function makeDocSnapshot(id: string, data: StoredDoc | undefined) {
  return {
    id,
    exists: Boolean(data),
    data: () => (data ? cloneStoredDoc(data) : undefined),
    ref: {
      delete: jest.fn(async () => {
        store.delete(id)
      }),
    },
  }
}

function getDocRef(id: string) {
  return {
    id,
    async set(data: StoredDoc) {
      store.set(id, cloneStoredDoc(data))
    },
    async get() {
      return makeDocSnapshot(id, store.get(id))
    },
    async update(updates: StoredDoc) {
      const existing = store.get(id)
      if (!existing) {
        throw new Error(`Missing doc ${id}`)
      }

      const next = cloneStoredDoc(existing)
      for (const [key, value] of Object.entries(updates)) {
        if (value === DELETE_SENTINEL) {
          delete next[key]
        } else {
          next[key] = value
        }
      }
      store.set(id, next)
    },
  }
}

function getDbMock() {
  return {
    collection: jest.fn(() => ({
      where: jest.fn((_field: string, _op: string, uid: string) => ({
        get: jest.fn(async () => ({
          docs: [...store.entries()]
            .filter(([, data]) => data.uid === uid)
            .map(([id, data]) => makeDocSnapshot(id, data)),
        })),
      })),
      doc: jest.fn((id?: string) => getDocRef(id ?? `generated-${++autoIdCounter}`)),
    })),
    runTransaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        get: jest.fn(async (docRef: ReturnType<typeof getDocRef>) => docRef.get()),
        update: jest.fn((docRef: ReturnType<typeof getDocRef>, updates: StoredDoc) =>
          docRef.update(updates),
        ),
      }
      return callback(tx)
    }),
  }
}

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    delete: jest.fn(() => DELETE_SENTINEL),
  },
  Timestamp: {
    now: jest
      .fn()
      .mockImplementation(() => makeTimestamp(`2026-03-01T00:00:0${Math.min(autoIdCounter, 9)}.000Z`)),
  },
  getFirestore: jest.fn(() => getDbMock()),
}))

import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { TodosFirestoreRepository } from '../../../src/modules/todos/todos.firestore.repository'

describe('TodosFirestoreRepository (unit)', () => {
  beforeEach(() => {
    store.clear()
    autoIdCounter = 0
    jest.clearAllMocks()
  })

  it('findAllByUid returns only matching todos sorted by dueDate', async () => {
    store.set('b', {
      uid: 'user-1',
      title: 'Second',
      description: '',
      completed: false,
      dueDate: '2026-03-02',
      createdAt: makeTimestamp('2026-03-01T10:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T10:00:00.000Z'),
    })
    store.set('a', {
      uid: 'user-1',
      title: 'First',
      description: '',
      completed: false,
      dueDate: '2026-03-01',
      createdAt: makeTimestamp('2026-03-01T09:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T09:00:00.000Z'),
    })
    store.set('c', {
      uid: 'other-user',
      title: 'Other',
      description: '',
      completed: false,
      createdAt: makeTimestamp('2026-03-01T11:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T11:00:00.000Z'),
    })

    const repo = new TodosFirestoreRepository()
    await expect(repo.findAllByUid('user-1')).resolves.toMatchObject([
      { id: 'a', title: 'First' },
      { id: 'b', title: 'Second' },
    ])
  })

  it('create trims values and omits blank dueDate', async () => {
    const repo = new TodosFirestoreRepository()
    const todo = await repo.create('user-1', {
      title: '  New Todo  ',
      description: 'desc',
      dueDate: '   ',
    })

    expect(todo).toMatchObject({
      id: 'generated-1',
      uid: 'user-1',
      title: 'New Todo',
      description: 'desc',
      completed: false,
      dueDate: undefined,
    })

    expect(store.get('generated-1')).toMatchObject({
      title: 'New Todo',
      description: 'desc',
    })
  })

  it('create stores a trimmed dueDate when provided', async () => {
    const repo = new TodosFirestoreRepository()
    const todo = await repo.create('user-1', {
      title: 'With due',
      dueDate: ' 2026-03-09 ',
    })

    expect(todo.dueDate).toBe('2026-03-09')
    expect(store.get('generated-1')).toMatchObject({
      dueDate: '2026-03-09',
    })
  })

  it('findById returns null when the todo is missing', async () => {
    const repo = new TodosFirestoreRepository()
    await expect(repo.findById('missing')).resolves.toBeNull()
  })

  it('findById returns the todo when present', async () => {
    store.set('todo-1', {
      uid: 'user-1',
      title: 'Found',
      description: '',
      completed: false,
      createdAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
    })

    const repo = new TodosFirestoreRepository()
    await expect(repo.findById('todo-1')).resolves.toMatchObject({
      id: 'todo-1',
      title: 'Found',
    })
  })

  it('update trims title and clears dueDate with FieldValue.delete', async () => {
    store.set('todo-1', {
      uid: 'user-1',
      title: 'Original',
      description: 'before',
      completed: false,
      dueDate: '2026-03-05',
      createdAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
    })

    const repo = new TodosFirestoreRepository()
    const todo = await repo.update('todo-1', {
      title: '  Updated  ',
      description: null as never,
      completed: true,
      dueDate: null,
    })

    expect(FieldValue.delete).toHaveBeenCalledTimes(1)
    expect(Timestamp.now).toHaveBeenCalled()
    expect(todo).toMatchObject({
      id: 'todo-1',
      title: 'Updated',
      description: '',
      completed: true,
      dueDate: undefined,
    })
    expect(store.get('todo-1')).toMatchObject({
      title: 'Updated',
      description: '',
      completed: true,
    })
    expect(store.get('todo-1')).not.toHaveProperty('dueDate')
  })

  it('delete returns false when the todo is missing', async () => {
    const repo = new TodosFirestoreRepository()
    await expect(repo.delete('missing')).resolves.toBe(false)
  })

  it('delete removes an existing todo and returns true', async () => {
    store.set('todo-1', {
      uid: 'user-1',
      title: 'Delete me',
      description: '',
      completed: false,
      createdAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
    })

    const repo = new TodosFirestoreRepository()
    await expect(repo.delete('todo-1')).resolves.toBe(true)
    expect(store.has('todo-1')).toBe(false)
  })

  it('toggle returns null when the todo is missing or owned by another user', async () => {
    store.set('todo-1', {
      uid: 'other-user',
      title: 'Locked',
      description: '',
      completed: false,
      createdAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
    })

    const repo = new TodosFirestoreRepository()
    await expect(repo.toggle('missing', 'user-1')).resolves.toBeNull()
    await expect(repo.toggle('todo-1', 'user-1')).resolves.toBeNull()
  })

  it('toggle flips completed and returns ISO timestamps', async () => {
    store.set('todo-1', {
      uid: 'user-1',
      title: 'Toggle me',
      description: 'desc',
      completed: false,
      createdAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
    })

    const repo = new TodosFirestoreRepository()
    const todo = await repo.toggle('todo-1', 'user-1')

    expect(todo).toMatchObject({
      id: 'todo-1',
      completed: true,
      createdAt: '2026-03-01T08:00:00.000Z',
    })
    expect(store.get('todo-1')).toMatchObject({
      completed: true,
    })
  })
})
