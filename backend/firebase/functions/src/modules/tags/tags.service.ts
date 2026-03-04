import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import type { CreateTagRequest, ITagsRepository, Tag, UpdateTagRequest } from './tags.types'
import { AppError } from '../../core/http/errors'

export class TagsService {
  constructor(private readonly repo: ITagsRepository) {}

  async list(uid: string): Promise<Tag[]> {
    return this.repo.list(uid)
  }

  async create(uid: string, payload: CreateTagRequest): Promise<Tag> {
    const name = payload.name?.trim() ?? ''
    const emoji = payload.emoji?.trim() ?? ''
    if (!name) throw new AppError('VALIDATION_ERROR', 'Tag name is required')
    if (!emoji) throw new AppError('VALIDATION_ERROR', 'Tag emoji is required')
    return this.repo.create(uid, { ...payload, name, emoji })
  }

  async update(tagId: string, uid: string, payload: UpdateTagRequest): Promise<Tag> {
    const existing = await this.repo.getById(uid, tagId)
    if (!existing) throw new AppError('NOT_FOUND', 'Tag not found')
    const name = payload.name?.trim() ?? ''
    const emoji = payload.emoji?.trim() ?? ''
    if (!name) throw new AppError('VALIDATION_ERROR', 'Tag name is required')
    if (!emoji) throw new AppError('VALIDATION_ERROR', 'Tag emoji is required')
    const result = await this.repo.update(tagId, uid, { ...payload, name, emoji })
    if (!result) throw new AppError('NOT_FOUND', 'Tag not found')
    return result
  }

  async delete(tagId: string, uid: string): Promise<void> {
    const existing = await this.repo.getById(uid, tagId)
    if (!existing) throw new AppError('NOT_FOUND', 'Tag not found')
    const db = getFirestore()
    const tagDocRef = db.collection('users').doc(uid).collection('tags').doc(tagId)
    const snap = await db.collection('todos').where('uid', '==', uid).get()
    const now = Timestamp.now()
    const batch = db.batch()

    batch.delete(tagDocRef)

    for (const doc of snap.docs) {
      const tagIds = doc.data().tagIds
      if (!Array.isArray(tagIds) || !tagIds.includes(tagId)) continue
      batch.update(doc.ref, {
        tagIds: FieldValue.arrayRemove(tagId),
        updatedAt: now,
      })
    }

    await batch.commit()
  }
}
