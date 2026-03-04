import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import axios from 'axios'
import type {
  ApiResponseDto,
  CreateTodoRequest,
  Todo,
  UpdateTodoRequest,
} from '../../../../../shared/types/api'
import { AUTH_HOST, BASE_URL, PROJECT_ID } from './testEnv'

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID })
}
const db = getFirestore()
const auth = getAuth()

function unwrapSuccess<T>(body: ApiResponseDto<T>): T {
  if (!body || typeof body !== 'object' || body.success !== true) {
    throw new Error('Expected success response')
  }
  return body.data
}

async function getIdTokenForUid(uid: string): Promise<string> {
  const customToken = await auth.createCustomToken(uid)
  const response = await axios.post(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo-key`,
    { token: customToken, returnSecureToken: true },
  )
  return response.data.idToken as string
}

describe('GET /todos', () => {
  const uid = `test-todos-get-${Date.now()}`
  let idToken: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await getIdTokenForUid(uid)
    // Seed one todo for this user
    await db.collection('todos').add({
      uid, title: 'My Todo', completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    // Seed one todo with dueDate for this user
    await db.collection('todos').add({
      uid, title: 'Todo With Due', dueDate: '2026-01-15', completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    // Seed one todo for another user (must NOT be returned)
    await db.collection('todos').add({
      uid: 'other-user', title: 'Other Todo', completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  })

  afterAll(async () => {
    const snap = await db.collection('todos').where('uid', '==', uid).get()
    const batch = db.batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    await auth.deleteUser(uid)
  })

  it('returns 401 without token', async () => {
    const res = await axios.get(`${BASE_URL}/todos`, { validateStatus: () => true })
    expect(res.status).toBe(401)
  })

  it('returns only this user\'s todos', async () => {
    const res = await axios.get<ApiResponseDto<Todo[]>>(`${BASE_URL}/todos`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect(res.status).toBe(200)
    const todos = unwrapSuccess(res.data)
    expect(todos.every(t => t.uid === uid)).toBe(true)
    expect(todos.find(t => t.title === 'My Todo')).toBeDefined()
    expect(todos.find(t => t.title === 'Other Todo')).toBeUndefined()
  })

  it('returns dueDate for todos that have it', async () => {
    const res = await axios.get<ApiResponseDto<Todo[]>>(`${BASE_URL}/todos`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect(res.status).toBe(200)
    const withDue = unwrapSuccess(res.data).find(t => t.title === 'Todo With Due')
    expect(withDue).toBeDefined()
    expect(withDue!.dueDate).toBe('2026-01-15')
  })
})

describe('POST /todos', () => {
  const uid = `test-todos-post-${Date.now()}`
  let idToken: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await getIdTokenForUid(uid)
  })

  afterAll(async () => {
    const snap = await db.collection('todos').where('uid', '==', uid).get()
    const batch = db.batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    await auth.deleteUser(uid)
  })

  it('returns 401 without token', async () => {
    const res = await axios.post(`${BASE_URL}/todos`, { title: 'x' }, { validateStatus: () => true })
    expect(res.status).toBe(401)
  })

  it('returns 400 without title', async () => {
    const res = await axios.post(
      `${BASE_URL}/todos`,
      {},
      { headers: { Authorization: `Bearer ${idToken}` }, validateStatus: () => true },
    )
    expect(res.status).toBe(400)
  })

  it('creates todo and returns it', async () => {
    const body: CreateTodoRequest = { title: 'New Todo', description: 'desc' }
    const res = await axios.post<ApiResponseDto<Todo>>(`${BASE_URL}/todos`, body, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect([200, 201]).toContain(res.status)
    const todo = unwrapSuccess(res.data)
    expect(todo.uid).toBe(uid)
    expect(todo.title).toBe('New Todo')
    expect(todo.completed).toBe(false)
    expect(todo.id).toBeDefined()
    expect(todo.createdAt).toBeDefined()
    expect(todo.updatedAt).toBeDefined()
  })

  it('creates todo with dueDate and returns it', async () => {
    const body: CreateTodoRequest = { title: 'With Due', dueDate: '2026-03-01' }
    const res = await axios.post<ApiResponseDto<Todo>>(`${BASE_URL}/todos`, body, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect([200, 201]).toContain(res.status)
    const todo = unwrapSuccess(res.data)
    expect(todo.dueDate).toBe('2026-03-01')
    expect(todo.title).toBe('With Due')
  })

  it('creates todo with tagIds when tags belong to user', async () => {
    const tagRef = await db
      .collection('users')
      .doc(uid)
      .collection('tags')
      .add({
        name: 'MyTag',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    const body: CreateTodoRequest = { title: 'Tagged Todo', tagIds: [tagRef.id] }
    const res = await axios.post<ApiResponseDto<Todo>>(`${BASE_URL}/todos`, body, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect([200, 201]).toContain(res.status)
    const todo = unwrapSuccess(res.data)
    expect(todo.tagIds).toEqual([tagRef.id])
  })
})

describe('POST /todos with invalid tagIds', () => {
  const uid = `test-todos-tagids-${Date.now()}`
  const otherUid = `test-todos-other-${Date.now()}`
  let idToken: string
  let otherToken: string
  let otherTagId: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    await auth.createUser({ uid: otherUid, email: `${otherUid}@example.com` })
    idToken = await getIdTokenForUid(uid)
    otherToken = await getIdTokenForUid(otherUid)
    const tagRef = await db
      .collection('users')
      .doc(otherUid)
      .collection('tags')
      .add({
        name: 'OtherTag',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    otherTagId = tagRef.id
  })

  afterAll(async () => {
    const snap = await db.collection('todos').where('uid', '==', uid).get()
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    await auth.deleteUser(uid)
    await auth.deleteUser(otherUid)
  })

  it('returns 403 when tagIds include tag owned by another user', async () => {
    const res = await axios.post<ApiResponseDto<Todo>>(
      `${BASE_URL}/todos`,
      { title: 'Hacked', tagIds: [otherTagId] },
      { headers: { Authorization: `Bearer ${idToken}` }, validateStatus: () => true },
    )
    if (res.status === 200 && res.data && typeof res.data === 'object' && 'success' in res.data) {
      expect((res.data as ApiResponseDto<Todo>).success).toBe(false)
      expect(res.data).toMatchObject({ success: false, code: 'FORBIDDEN' })
    } else {
      expect(res.status).toBe(403)
    }
  })
})

describe('PATCH /todos/:id/toggle', () => {
  const uid = `test-todos-toggle-${Date.now()}`
  let idToken: string
  let todoId: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await getIdTokenForUid(uid)
    const doc = await db.collection('todos').add({
      uid, title: 'Toggle Me', completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    todoId = doc.id
  })

  afterAll(async () => {
    await db.collection('todos').doc(todoId).delete()
    await auth.deleteUser(uid)
  })

  it('returns 403 when uid does not own todo', async () => {
    const otherUid = `other-${Date.now()}`
    await auth.createUser({ uid: otherUid, email: `${otherUid}@example.com` })
    const otherToken = await getIdTokenForUid(otherUid)
    const res = await axios.patch(
      `${BASE_URL}/todos/${todoId}/toggle`,
      {},
      { headers: { Authorization: `Bearer ${otherToken}` }, validateStatus: () => true },
    )
    expect(res.status).toBe(403)
    await auth.deleteUser(otherUid)
  })

  it('toggles completed and updates updatedAt', async () => {
    const before = (await db.collection('todos').doc(todoId).get()).data()!
    const res = await axios.patch<ApiResponseDto<Todo>>(
      `${BASE_URL}/todos/${todoId}/toggle`,
      {},
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    expect(res.status).toBe(200)
    const todo = unwrapSuccess(res.data)
    expect(todo.completed).toBe(!before.completed)
    expect(new Date(todo.updatedAt).getTime()).toBeGreaterThan(
      before.updatedAt.toDate().getTime(),
    )
  })
})

describe('PATCH /todos/:id', () => {
  const uid = `test-todos-update-${Date.now()}`
  let idToken: string
  let todoId: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await getIdTokenForUid(uid)
    const doc = await db.collection('todos').add({
      uid,
      title: 'Original',
      description: 'desc',
      completed: false,
      dueDate: '2026-02-01',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    todoId = doc.id
  })

  afterAll(async () => {
    await db.collection('todos').doc(todoId).delete().catch(() => {})
    await auth.deleteUser(uid)
  })

  it('returns 401 without token', async () => {
    const res = await axios.patch(
      `${BASE_URL}/todos/${todoId}`,
      { title: 'x' },
      { validateStatus: () => true },
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 for non-existent id', async () => {
    const res = await axios.patch(
      `${BASE_URL}/todos/non-existent-id`,
      { title: 'x' },
      { headers: { Authorization: `Bearer ${idToken}` }, validateStatus: () => true },
    )
    expect(res.status).toBe(404)
  })

  it('returns 403 when uid does not own todo', async () => {
    const otherUid = `other-update-${Date.now()}`
    await auth.createUser({ uid: otherUid, email: `${otherUid}@example.com` })
    const otherToken = await getIdTokenForUid(otherUid)
    const res = await axios.patch(
      `${BASE_URL}/todos/${todoId}`,
      { title: 'Hacked' },
      { headers: { Authorization: `Bearer ${otherToken}` }, validateStatus: () => true },
    )
    expect(res.status).toBe(403)
    await auth.deleteUser(otherUid)
  })

  it('updates title, description, dueDate, completed and returns todo', async () => {
    const res = await axios.patch<ApiResponseDto<Todo>>(
      `${BASE_URL}/todos/${todoId}`,
      {
        title: 'Updated Title',
        description: 'new desc',
        dueDate: '2026-04-01',
        completed: true,
      },
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    expect(res.status).toBe(200)
    const todo = unwrapSuccess(res.data)
    expect(todo.title).toBe('Updated Title')
    expect(todo.description).toBe('new desc')
    expect(todo.dueDate).toBe('2026-04-01')
    expect(todo.completed).toBe(true)
  })

  it('clears dueDate when null is sent', async () => {
    const res = await axios.patch<ApiResponseDto<Todo>>(
      `${BASE_URL}/todos/${todoId}`,
      { dueDate: null },
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    expect(res.status).toBe(200)
    const todo = unwrapSuccess(res.data)
    expect(todo.dueDate).toBeUndefined()
  })

  it('updates tagIds when all belong to user', async () => {
    const tagRef = await db
      .collection('users')
      .doc(uid)
      .collection('tags')
      .add({
        name: 'UpdateTag',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    const res = await axios.patch<ApiResponseDto<Todo>>(
      `${BASE_URL}/todos/${todoId}`,
      { tagIds: [tagRef.id] } as UpdateTodoRequest,
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    expect(res.status).toBe(200)
    const todo = unwrapSuccess(res.data)
    expect(Array.isArray(todo.tagIds) ? todo.tagIds : []).toEqual([tagRef.id])
  })
})

describe('DELETE /todos/:id', () => {
  const uid = `test-todos-delete-${Date.now()}`
  let idToken: string
  let todoId: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await getIdTokenForUid(uid)
    const doc = await db.collection('todos').add({
      uid,
      title: 'To Delete',
      completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    todoId = doc.id
  })

  afterAll(async () => {
    await db.collection('todos').doc(todoId).delete().catch(() => {})
    await auth.deleteUser(uid)
  })

  it('returns 401 without token', async () => {
    const res = await axios.delete(`${BASE_URL}/todos/${todoId}`, {
      validateStatus: () => true,
    })
    expect(res.status).toBe(401)
  })

  it('returns 404 for non-existent id', async () => {
    const res = await axios.delete(`${BASE_URL}/todos/non-existent-id`, {
      headers: { Authorization: `Bearer ${idToken}` },
      validateStatus: () => true,
    })
    expect(res.status).toBe(404)
  })

  it('returns 403 when uid does not own todo', async () => {
    const otherUid = `other-delete-${Date.now()}`
    await auth.createUser({ uid: otherUid, email: `${otherUid}@example.com` })
    const otherToken = await getIdTokenForUid(otherUid)
    const res = await axios.delete(`${BASE_URL}/todos/${todoId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
      validateStatus: () => true,
    })
    expect(res.status).toBe(403)
    await auth.deleteUser(otherUid)
  })

  it('deletes own todo and returns 204 with no body', async () => {
    const res = await axios.delete(`${BASE_URL}/todos/${todoId}`, {
      headers: { Authorization: `Bearer ${idToken}` },
      validateStatus: () => true,
    })
    expect([200, 204]).toContain(res.status)
    if (res.status === 204) expect(res.data).toBe('')
    const snap = await db.collection('todos').doc(todoId).get()
    expect(snap.exists).toBe(false)
  })
})

describe('DELETE /tags/:tagId clears tagId from todos', () => {
  const uid = `test-tag-delete-cleanup-${Date.now()}`
  const otherUid = `test-tag-delete-cleanup-other-${Date.now()}`
  let idToken: string
  let tagId: string
  let todoId: string | undefined

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    await auth.createUser({ uid: otherUid, email: `${otherUid}@example.com` })
    idToken = await getIdTokenForUid(uid)
    const tagRef = await db
      .collection('users')
      .doc(uid)
      .collection('tags')
      .add({
        name: 'ToDelete',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    tagId = tagRef.id
    const todoRes = await axios.post<ApiResponseDto<Todo>>(
      `${BASE_URL}/todos`,
      { title: 'Todo With Tag', tagIds: [tagId] },
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    todoId = unwrapSuccess(todoRes.data).id
  })

  afterAll(async () => {
    if (todoId) {
      await db.collection('todos').doc(todoId).delete().catch(() => {})
    }
    await auth.deleteUser(uid)
    await auth.deleteUser(otherUid)
  })

  it('after deleting tag, todo tagIds no longer contains that tagId', async () => {
    const listBefore = await axios.get<ApiResponseDto<Todo[]>>(`${BASE_URL}/todos`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    const todoBefore = unwrapSuccess(listBefore.data).find((t) => t.id === todoId)
    expect(todoBefore).toBeDefined()
    const tagIdsBefore = todoBefore!.tagIds ?? []
    expect(tagIdsBefore).toContain(tagId)

    await axios.delete(`${BASE_URL}/tags/${tagId}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })

    const listAfter = await axios.get<ApiResponseDto<Todo[]>>(`${BASE_URL}/todos`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    const todoAfter = unwrapSuccess(listAfter.data).find((t) => t.id === todoId)
    expect(todoAfter).toBeDefined()
    const tagIdsAfter = todoAfter!.tagIds ?? []
    expect(tagIdsAfter).not.toContain(tagId)
  })

  it('does not remove matching tagId from another user todo', async () => {
    const isolatedTagRef = await db
      .collection('users')
      .doc(uid)
      .collection('tags')
      .add({
        name: 'ScopedDelete',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    const isolatedOtherTodoId = `other-isolated-${Date.now()}`
    await db.collection('todos').doc(isolatedOtherTodoId).set({
      uid: otherUid,
      title: 'Other User Todo With Same TagId Isolated',
      description: '',
      completed: false,
      tagIds: [isolatedTagRef.id],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    await axios.delete(`${BASE_URL}/tags/${isolatedTagRef.id}`, {
      headers: { Authorization: `Bearer ${idToken}` },
      validateStatus: () => true,
    })

    const otherTodoSnap = await db.collection('todos').doc(isolatedOtherTodoId).get()
    expect(otherTodoSnap.exists).toBe(true)
    expect(otherTodoSnap.data()?.tagIds ?? []).toContain(isolatedTagRef.id)

    await db.collection('todos').doc(isolatedOtherTodoId).delete().catch(() => {})
  })
})
