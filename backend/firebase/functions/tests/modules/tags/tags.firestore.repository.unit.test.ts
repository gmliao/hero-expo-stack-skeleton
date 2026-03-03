type StoredTag = Record<string, unknown>

const store = new Map<string, StoredTag>()
let autoIdCounter = 0

function key(uid: string, tagId: string) {
  return `${uid}:${tagId}`
}

function makeTimestamp(iso: string) {
  return {
    toDate: () => new Date(iso),
  }
}

function makeDocSnapshot(id: string, data: StoredTag | undefined) {
  return {
    id,
    exists: Boolean(data),
    data: () => (data ? { ...data } : undefined),
    ref: {
      delete: jest.fn(async () => {
        for (const [k, v] of store.entries()) {
          if (v && (v as { id?: string }).id === id) {
            store.delete(k)
            break
          }
        }
      }),
    },
  }
}

function getTagsColMock(uid: string) {
  const docRefs = new Map<string, { set: jest.Mock; get: jest.Mock; update: jest.Mock; delete: jest.Mock }>()
  return {
    orderBy: jest.fn(() => ({
      get: jest.fn(async () => {
        const entries = [...store.entries()]
          .filter(([k]) => k.startsWith(`${uid}:`))
          .map(([k, data]) => {
            const tagId = k.split(':')[1]
            return makeDocSnapshot(tagId, data)
          })
        entries.sort((a, b) => {
          const aData = store.get(`${uid}:${a.id}`) as { createdAt?: { toDate: () => Date } }
          const bData = store.get(`${uid}:${b.id}`) as { createdAt?: { toDate: () => Date } }
          const at = aData?.createdAt?.toDate?.()?.getTime() ?? 0
          const bt = bData?.createdAt?.toDate?.()?.getTime() ?? 0
          return bt - at
        })
        return { docs: entries }
      }),
    })),
    doc: jest.fn((tagId?: string) => {
      const id = tagId ?? `generated-${++autoIdCounter}`
      if (!docRefs.has(id)) {
        docRefs.set(id, {
          set: jest.fn(async (data: StoredTag) => {
            store.set(key(uid, id), { ...data })
          }),
          get: jest.fn(async () => makeDocSnapshot(id, store.get(key(uid, id)))),
          update: jest.fn(async (updates: StoredTag) => {
            const existing = store.get(key(uid, id))
            if (!existing) throw new Error(`Missing doc ${uid}/tags/${id}`)
            store.set(key(uid, id), { ...existing, ...updates })
          }),
          delete: jest.fn(async () => {
            store.delete(key(uid, id))
          }),
        })
      }
      const ref = docRefs.get(id)!
      return {
        id,
        set: ref.set,
        get: ref.get,
        update: ref.update,
        delete: ref.delete,
      }
    }),
  }
}

function getDbMock() {
  return {
    collection: jest.fn((name: string) => {
      if (name !== 'users') {
        throw new Error(`Unexpected collection: ${name}`)
      }
      return {
        doc: jest.fn((uid: string) => ({
          collection: jest.fn((subName: string) => {
            if (subName !== 'tags') {
              throw new Error(`Unexpected subcollection: ${subName}`)
            }
            return getTagsColMock(uid)
          }),
        })),
      }
    }),
  }
}

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => getDbMock()),
  Timestamp: {
    now: jest
      .fn()
      .mockImplementation(() => makeTimestamp(`2026-03-01T00:00:0${Math.min(autoIdCounter, 9)}.000Z`)),
  },
}))

import { TagsFirestoreRepository } from '../../../src/modules/tags/tags.firestore.repository'

describe('TagsFirestoreRepository (unit)', () => {
  beforeEach(() => {
    store.clear()
    autoIdCounter = 0
    jest.clearAllMocks()
  })

  it('list returns tags for uid ordered by createdAt desc', async () => {
    store.set('user-1:tag-a', {
      name: 'Alpha',
      uid: 'user-1',
      createdAt: makeTimestamp('2026-03-01T09:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T09:00:00.000Z'),
    })
    store.set('user-1:tag-b', {
      name: 'Beta',
      uid: 'user-1',
      createdAt: makeTimestamp('2026-03-01T10:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T10:00:00.000Z'),
    })
    store.set('user-2:tag-c', {
      name: 'Other user',
      uid: 'user-2',
      createdAt: makeTimestamp('2026-03-01T11:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T11:00:00.000Z'),
    })

    const repo = new TagsFirestoreRepository()
    const list = await repo.list('user-1')
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ id: 'tag-b', name: 'Beta' })
    expect(list[1]).toMatchObject({ id: 'tag-a', name: 'Alpha' })
  })

  it('create adds doc with name, uid, timestamps', async () => {
    const repo = new TagsFirestoreRepository()
    const tag = await repo.create('user-1', '  Work  ')
    expect(tag).toMatchObject({
      id: 'generated-1',
      name: 'Work',
      uid: 'user-1',
    })
    expect(tag.createdAt).toBeDefined()
    expect(tag.updatedAt).toBeDefined()
    expect(store.get('user-1:generated-1')).toMatchObject({
      name: 'Work',
      uid: 'user-1',
    })
  })

  it('getById returns null when tag is missing', async () => {
    const repo = new TagsFirestoreRepository()
    await expect(repo.getById('user-1', 'missing')).resolves.toBeNull()
  })

  it('getById returns tag when present', async () => {
    store.set('user-1:tag-1', {
      name: 'Found',
      uid: 'user-1',
      createdAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
    })
    const repo = new TagsFirestoreRepository()
    await expect(repo.getById('user-1', 'tag-1')).resolves.toMatchObject({
      id: 'tag-1',
      name: 'Found',
      uid: 'user-1',
    })
  })

  it('update returns null when doc does not exist', async () => {
    const repo = new TagsFirestoreRepository()
    await expect(repo.update('missing', 'user-1', { name: 'New' })).resolves.toBeNull()
  })

  it('update sets name and updatedAt', async () => {
    store.set('user-1:tag-1', {
      name: 'Old',
      uid: 'user-1',
      createdAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
    })
    const repo = new TagsFirestoreRepository()
    const tag = await repo.update('tag-1', 'user-1', { name: '  Updated  ' })
    expect(tag).toMatchObject({ id: 'tag-1', name: 'Updated' })
    expect(store.get('user-1:tag-1')).toMatchObject({ name: 'Updated' })
  })

  it('delete returns false when doc does not exist', async () => {
    const repo = new TagsFirestoreRepository()
    await expect(repo.delete('user-1', 'missing')).resolves.toBe(false)
  })

  it('delete removes doc and returns true', async () => {
    store.set('user-1:tag-1', {
      name: 'Delete me',
      uid: 'user-1',
      createdAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
      updatedAt: makeTimestamp('2026-03-01T08:00:00.000Z'),
    })
    const repo = new TagsFirestoreRepository()
    await expect(repo.delete('user-1', 'tag-1')).resolves.toBe(true)
    expect(store.has('user-1:tag-1')).toBe(false)
  })
})
