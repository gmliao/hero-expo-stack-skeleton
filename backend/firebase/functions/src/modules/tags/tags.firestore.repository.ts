import { DocumentData, getFirestore, Timestamp } from 'firebase-admin/firestore'
import type { Tag } from './tags.types'

const db = () => getFirestore()

function tagsCol(uid: string) {
  return db().collection('users').doc(uid).collection('tags')
}

function docToTag(docId: string, data: DocumentData): Tag {
  return {
    id: docId,
    name: data.name,
    uid: data.uid,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
  }
}

export class TagsFirestoreRepository {
  /**
   * List all tags for a user in users/{uid}/tags, ordered by createdAt descending.
   */
  async list(uid: string): Promise<Tag[]> {
    const snap = await tagsCol(uid)
      .orderBy('createdAt', 'desc')
      .get()
    return snap.docs.map(d => docToTag(d.id, d.data()))
  }

  /**
   * Create a tag in users/{uid}/tags. Document id is auto-generated.
   */
  async create(uid: string, name: string): Promise<Tag> {
    const now = Timestamp.now()
    const docRef = tagsCol(uid).doc()
    const docData = {
      name: name.trim(),
      uid,
      createdAt: now,
      updatedAt: now,
    }
    await docRef.set(docData)
    const doc = await docRef.get()
    return docToTag(docRef.id, doc.data()!)
  }

  /**
   * Get a tag by id from users/{uid}/tags/{tagId}.
   */
  async getById(uid: string, tagId: string): Promise<Tag | null> {
    const doc = await tagsCol(uid).doc(tagId).get()
    if (!doc.exists) return null
    return docToTag(doc.id, doc.data()!)
  }

  /**
   * Update name and updatedAt at users/{uid}/tags/{tagId}. Returns null if doc does not exist.
   */
  async update(tagId: string, uid: string, { name }: { name: string }): Promise<Tag | null> {
    const docRef = tagsCol(uid).doc(tagId)
    const doc = await docRef.get()
    if (!doc.exists) return null
    await docRef.update({
      name: name.trim(),
      updatedAt: Timestamp.now(),
    })
    const updated = await docRef.get()
    return docToTag(updated.id, updated.data()!)
  }

  /**
   * Delete users/{uid}/tags/{tagId}. Returns true if deleted, false if doc did not exist.
   */
  async delete(uid: string, tagId: string): Promise<boolean> {
    const docRef = tagsCol(uid).doc(tagId)
    const doc = await docRef.get()
    if (!doc.exists) return false
    await docRef.delete()
    return true
  }
}
