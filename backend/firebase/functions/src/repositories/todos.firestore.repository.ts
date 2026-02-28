import * as admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { Todo, UpdateTodoRequest } from '../types/api'
import type { ITodosRepository, CreateTodoInput } from './types'

const db = () => admin.firestore()

function docToTodo(docId: string, data: admin.firestore.DocumentData): Todo {
  return {
    id: docId,
    uid: data.uid,
    title: data.title,
    description: data.description,
    completed: data.completed,
    dueDate: data.dueDate ?? undefined,
    createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
    updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
  }
}

export class TodosFirestoreRepository implements ITodosRepository {
  private readonly collection = 'todos'

  async findAllByUid(uid: string): Promise<Todo[]> {
    const snap = await db().collection(this.collection).where('uid', '==', uid).get()
    const todos = snap.docs.map(d => docToTodo(d.id, d.data()))
    todos.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    return todos
  }

  async create(uid: string, data: CreateTodoInput): Promise<Todo> {
    const now = Timestamp.now()
    const docData: Record<string, unknown> = {
      uid,
      title: data.title.trim(),
      description: data.description ?? '',
      completed: false,
      createdAt: now,
      updatedAt: now,
    }
    if (data.dueDate != null && String(data.dueDate).trim() !== '') {
      docData.dueDate = String(data.dueDate).trim()
    }
    const docRef = db().collection(this.collection).doc()
    await docRef.set(docData)
    const doc = await docRef.get()
    return docToTodo(docRef.id, doc.data()!)
  }

  async findById(id: string): Promise<Todo | null> {
    const doc = await db().collection(this.collection).doc(id).get()
    if (!doc.exists) return null
    return docToTodo(doc.id, doc.data()!)
  }

  async update(id: string, body: Partial<UpdateTodoRequest>): Promise<Todo | null> {
    const docRef = db().collection(this.collection).doc(id)
    const doc = await docRef.get()
    if (!doc.exists) return null

    const updates: Record<string, unknown> = { updatedAt: Timestamp.now() }
    const allowed: (keyof UpdateTodoRequest)[] = ['title', 'description', 'completed', 'dueDate']
    for (const key of allowed) {
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
    return docToTodo(updated.id, updated.data()!)
  }

  async delete(id: string): Promise<boolean> {
    const doc = await db().collection(this.collection).doc(id).get()
    if (!doc.exists) return false
    await doc.ref.delete()
    return true
  }

  async toggle(id: string, uid: string): Promise<Todo | null> {
    const docRef = db().collection(this.collection).doc(id)
    const todo = await db().runTransaction(async tx => {
      const doc = await tx.get(docRef)
      if (!doc.exists) return null
      const data = doc.data()!
      if (data.uid !== uid) return null
      const updatedAt = Timestamp.now()
      const completed = !data.completed
      tx.update(docRef, { completed, updatedAt })
      return {
        id: doc.id,
        uid: data.uid,
        title: data.title,
        description: data.description,
        completed,
        createdAt: data.createdAt as Timestamp,
        updatedAt,
      }
    })
    if (!todo) return null
    return {
      ...todo,
      createdAt: (todo.createdAt as Timestamp).toDate().toISOString(),
      updatedAt: (todo.updatedAt as Timestamp).toDate().toISOString(),
    }
  }
}
