import * as admin from 'firebase-admin'
import axios from 'axios'
import type { Todo, CreateTodoRequest } from '../../../../shared/types/api'

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

const PROJECT_ID = 'hero-stack-local'
const BASE_URL = `http://127.0.0.1:5001/${PROJECT_ID}/us-central1/api`

async function getIdTokenForUid(uid: string): Promise<string> {
  const customToken = await auth.createCustomToken(uid)
  const response = await axios.post(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo-key',
    { token: customToken, returnSecureToken: true },
  )
  return response.data.idToken as string
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'hero-stack-local' })
}

const db = admin.firestore()
const auth = admin.auth()

describe('GET /todos', () => {
  const uid = `test-todos-get-${Date.now()}`
  let idToken: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await getIdTokenForUid(uid)
    // Seed one todo for this user
    await db.collection('todos').add({
      uid, title: 'My Todo', completed: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    })
    // Seed one todo with dueDate for this user
    await db.collection('todos').add({
      uid, title: 'Todo With Due', dueDate: '2026-01-15', completed: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    })
    // Seed one todo for another user (must NOT be returned)
    await db.collection('todos').add({
      uid: 'other-user', title: 'Other Todo', completed: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
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
    const res = await axios.get(`${BASE_URL}/todos`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect(res.status).toBe(200)
    const todos: Todo[] = res.data
    expect(todos.every(t => t.uid === uid)).toBe(true)
    expect(todos.find(t => t.title === 'My Todo')).toBeDefined()
    expect(todos.find(t => t.title === 'Other Todo')).toBeUndefined()
  })

  it('returns dueDate for todos that have it', async () => {
    const res = await axios.get(`${BASE_URL}/todos`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect(res.status).toBe(200)
    const withDue = (res.data as Todo[]).find(t => t.title === 'Todo With Due')
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
    const res = await axios.post(`${BASE_URL}/todos`, body, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect(res.status).toBe(201)
    const todo: Todo = res.data
    expect(todo.uid).toBe(uid)
    expect(todo.title).toBe('New Todo')
    expect(todo.completed).toBe(false)
    expect(todo.id).toBeDefined()
    expect(todo.createdAt).toBeDefined()
    expect(todo.updatedAt).toBeDefined()
  })

  it('creates todo with dueDate and returns it', async () => {
    const body: CreateTodoRequest = { title: 'With Due', dueDate: '2026-03-01' }
    const res = await axios.post(`${BASE_URL}/todos`, body, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect(res.status).toBe(201)
    const todo: Todo = res.data
    expect(todo.dueDate).toBe('2026-03-01')
    expect(todo.title).toBe('With Due')
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
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
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
    const res = await axios.patch(
      `${BASE_URL}/todos/${todoId}/toggle`,
      {},
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    expect(res.status).toBe(200)
    const todo: Todo = res.data
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
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
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
    const res = await axios.patch(
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
    const todo: Todo = res.data
    expect(todo.title).toBe('Updated Title')
    expect(todo.description).toBe('new desc')
    expect(todo.dueDate).toBe('2026-04-01')
    expect(todo.completed).toBe(true)
  })

  it('clears dueDate when null is sent', async () => {
    const res = await axios.patch(
      `${BASE_URL}/todos/${todoId}`,
      { dueDate: null },
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    expect(res.status).toBe(200)
    const todo: Todo = res.data
    expect(todo.dueDate).toBeUndefined()
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
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
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

  it('deletes own todo and returns 204', async () => {
    const res = await axios.delete(`${BASE_URL}/todos/${todoId}`, {
      headers: { Authorization: `Bearer ${idToken}` },
      validateStatus: () => true,
    })
    expect(res.status).toBe(204)
    const snap = await db.collection('todos').doc(todoId).get()
    expect(snap.exists).toBe(false)
  })
})
