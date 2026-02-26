import * as admin from 'firebase-admin'
import axios from 'axios'
import type { Todo, CreateTodoRequest } from '../../../../shared/types/api'

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

const BASE_URL = 'http://127.0.0.1:5001'

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
    idToken = await auth.createCustomToken(uid)
    // Seed one todo for this user
    await db.collection('todos').add({
      uid, title: 'My Todo', completed: false,
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
    const res = await axios.get(`${BASE_URL}/api/todos`, { validateStatus: () => true })
    expect(res.status).toBe(401)
  })

  it('returns only this user\'s todos', async () => {
    const res = await axios.get(`${BASE_URL}/api/todos`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    expect(res.status).toBe(200)
    const todos: Todo[] = res.data
    expect(todos.every(t => t.uid === uid)).toBe(true)
    expect(todos.find(t => t.title === 'My Todo')).toBeDefined()
    expect(todos.find(t => t.title === 'Other Todo')).toBeUndefined()
  })
})

describe('POST /todos', () => {
  const uid = `test-todos-post-${Date.now()}`
  let idToken: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await auth.createCustomToken(uid)
  })

  afterAll(async () => {
    const snap = await db.collection('todos').where('uid', '==', uid).get()
    const batch = db.batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    await auth.deleteUser(uid)
  })

  it('returns 401 without token', async () => {
    const res = await axios.post(`${BASE_URL}/api/todos`, { title: 'x' }, { validateStatus: () => true })
    expect(res.status).toBe(401)
  })

  it('returns 400 without title', async () => {
    const res = await axios.post(
      `${BASE_URL}/api/todos`,
      {},
      { headers: { Authorization: `Bearer ${idToken}` }, validateStatus: () => true },
    )
    expect(res.status).toBe(400)
  })

  it('creates todo and returns it', async () => {
    const body: CreateTodoRequest = { title: 'New Todo', description: 'desc' }
    const res = await axios.post(`${BASE_URL}/api/todos`, body, {
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
})

describe('PATCH /todos/:id/toggle', () => {
  const uid = `test-todos-toggle-${Date.now()}`
  let idToken: string
  let todoId: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await auth.createCustomToken(uid)
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
    const otherToken = await auth.createCustomToken(otherUid)
    const res = await axios.patch(
      `${BASE_URL}/api/todos/${todoId}/toggle`,
      {},
      { headers: { Authorization: `Bearer ${otherToken}` }, validateStatus: () => true },
    )
    expect(res.status).toBe(403)
    await auth.deleteUser(otherUid)
  })

  it('toggles completed and updates updatedAt', async () => {
    const before = (await db.collection('todos').doc(todoId).get()).data()!
    const res = await axios.patch(
      `${BASE_URL}/api/todos/${todoId}/toggle`,
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
