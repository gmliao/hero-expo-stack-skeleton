import { Response } from 'express'
import * as admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { AuthenticatedRequest } from '../middleware/auth'
import type { Todo, UpdateTodoRequest } from '../types/api'

const db = () => admin.firestore()

export async function getTodos(req: AuthenticatedRequest, res: Response): Promise<void> {
  const uid = req.uid!
  const snap = await db().collection('todos').where('uid', '==', uid).get()
  const todos: Todo[] = snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      uid: data.uid,
      title: data.title,
      description: data.description,
      completed: data.completed,
      dueDate: data.dueDate ?? undefined,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
    }
  })
  todos.sort((a, b) => {
    const aDue = a.dueDate ?? ''
    const bDue = b.dueDate ?? ''
    return aDue.localeCompare(bDue)
  })
  res.json(todos)
}

export async function createTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const uid = req.uid!
  const { title, description, dueDate } = req.body
  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  const now = Timestamp.now()
  const docData: Record<string, unknown> = {
    uid,
    title: title.trim(),
    description: description ?? '',
    completed: false,
    createdAt: now,
    updatedAt: now,
  }
  if (dueDate != null && String(dueDate).trim() !== '') {
    docData.dueDate = String(dueDate).trim()
  }
  const docRef = db().collection('todos').doc()
  await docRef.set(docData)
  const doc = await docRef.get()
  const data = doc.data()!
  const todo: Todo = {
    id: docRef.id,
    uid,
    title: data.title,
    description: data.description,
    completed: data.completed,
    dueDate: data.dueDate ?? undefined,
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

const UPDATE_ALLOWED: (keyof UpdateTodoRequest)[] = ['title', 'description', 'completed', 'dueDate']

export async function updateTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const uid = req.uid!
  const { id } = req.params
  const body = req.body as UpdateTodoRequest
  const docRef = db().collection('todos').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) {
    res.status(404).json({ error: 'Todo not found' })
    return
  }
  if (doc.data()!.uid !== uid) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() }
  for (const key of UPDATE_ALLOWED) {
    if (key in body && body[key] !== undefined) {
      if (key === 'title' && typeof body.title === 'string') {
        updates.title = body.title.trim()
      } else if (key === 'description') {
        updates.description = body.description ?? ''
      } else if (key === 'completed' && typeof body.completed === 'boolean') {
        updates.completed = body.completed
      } else if (key === 'dueDate') {
        const val = body.dueDate != null ? String(body.dueDate).trim() : ''
        updates.dueDate = val !== '' ? val : admin.firestore.FieldValue.delete()
      }
    }
  }
  await docRef.update(updates)
  const updated = await docRef.get()
  const data = updated.data()!
  const todo: Todo = {
    id: updated.id,
    uid: data.uid,
    title: data.title,
    description: data.description,
    completed: data.completed,
    dueDate: data.dueDate ?? undefined,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  }
  res.json(todo)
}

export async function deleteTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const uid = req.uid!
  const { id } = req.params
  const docRef = db().collection('todos').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) {
    res.status(404).json({ error: 'Todo not found' })
    return
  }
  if (doc.data()!.uid !== uid) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  await docRef.delete()
  res.status(204).send()
}
