import { Response } from 'express'
import * as admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { AuthenticatedRequest } from '../middleware/auth'
import type { Todo } from '../types/api'

const db = () => admin.firestore()

export async function getTodos(req: AuthenticatedRequest, res: Response): Promise<void> {
  const uid = req.uid!
  const snap = await db().collection('todos').where('uid', '==', uid).get()
  const todos: Todo[] = snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<Todo, 'id'>),
    createdAt: d.data().createdAt.toDate().toISOString(),
    updatedAt: d.data().updatedAt.toDate().toISOString(),
  }))
  res.json(todos)
}

export async function createTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const uid = req.uid!
  const { title, description } = req.body
  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  const now = Timestamp.now()
  const docRef = db().collection('todos').doc()
  await docRef.set({ uid, title: title.trim(), description: description ?? '', completed: false, createdAt: now, updatedAt: now })
  const doc = await docRef.get()
  const data = doc.data()!
  const todo: Todo = {
    id: docRef.id, uid,
    title: data.title, description: data.description,
    completed: data.completed,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  }
  res.status(201).json(todo)
}

export async function toggleTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const uid = req.uid!
  const { id } = req.params
  const docRef = db().collection('todos').doc(id)

  const todo = await db().runTransaction(async tx => {
    const doc = await tx.get(docRef)
    if (!doc.exists) { res.status(404).json({ error: 'Todo not found' }); return null }
    if (doc.data()!.uid !== uid) { res.status(403).json({ error: 'Forbidden' }); return null }
    const updatedAt = Timestamp.now()
    const completed = !doc.data()!.completed
    tx.update(docRef, { completed, updatedAt })
    const data = doc.data()!
    return {
      id: doc.id,
      uid: data.uid as string,
      title: data.title as string,
      description: data.description as string | undefined,
      completed,
      createdAt: data.createdAt as Timestamp,
      updatedAt,
    }
  })

  if (todo) {
    res.json({
      ...todo,
      createdAt: todo.createdAt.toDate().toISOString(),
      updatedAt: todo.updatedAt.toDate().toISOString(),
    })
  }
}
