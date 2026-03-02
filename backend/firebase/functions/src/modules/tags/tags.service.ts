import type { ITagsRepository, Tag } from './tags.types'
import { AppError } from '../../core/http/errors'

export class TagsService {
  constructor(private readonly repo: ITagsRepository) {}

  async list(uid: string): Promise<Tag[]> {
    return this.repo.list(uid)
  }

  async create(uid: string, name: string): Promise<Tag> {
    const trimmed = name?.trim() ?? ''
    if (!trimmed) throw new AppError('VALIDATION_ERROR', 'Tag name is required')
    return this.repo.create(uid, trimmed)
  }

  async update(tagId: string, uid: string, name: string): Promise<Tag> {
    const existing = await this.repo.getById(uid, tagId)
    if (!existing) throw new AppError('NOT_FOUND', 'Tag not found')
    const trimmed = name?.trim() ?? ''
    if (!trimmed) throw new AppError('VALIDATION_ERROR', 'Tag name is required')
    const result = await this.repo.update(tagId, uid, { name: trimmed })
    if (!result) throw new AppError('NOT_FOUND', 'Tag not found')
    return result
  }

  async delete(tagId: string, uid: string): Promise<void> {
    const existing = await this.repo.getById(uid, tagId)
    if (!existing) throw new AppError('NOT_FOUND', 'Tag not found')
    await this.repo.delete(uid, tagId)
  }
}
