import type { CreateTagRequest, Tag, UpdateTagRequest } from '../../src/types/api'
import type { ITagsRepository } from '../../src/modules/tags/tags.types'

export function createMockTagsRepository(initial: { tags?: Tag[] } = {}): ITagsRepository & { tags: Tag[] } {
  const tags = [...(initial.tags ?? [])]

  return {
    tags,

    async list(uid: string): Promise<Tag[]> {
      return tags.filter(t => t.uid === uid)
    },

    async create(uid: string, payload: CreateTagRequest): Promise<Tag> {
      const now = new Date().toISOString()
      const id = `tag-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const tag: Tag = {
        id,
        uid,
        name: payload.name.trim(),
        emoji: payload.emoji.trim(),
        colorToken: payload.colorToken,
        createdAt: now,
        updatedAt: now,
      }
      tags.push(tag)
      return tag
    },

    async getById(uid: string, tagId: string): Promise<Tag | null> {
      return tags.find(t => t.id === tagId && t.uid === uid) ?? null
    },

    async update(tagId: string, uid: string, payload: UpdateTagRequest): Promise<Tag | null> {
      const idx = tags.findIndex(t => t.id === tagId && t.uid === uid)
      if (idx < 0) return null
      tags[idx] = {
        ...tags[idx],
        name: payload.name.trim(),
        emoji: payload.emoji.trim(),
        colorToken: payload.colorToken,
        updatedAt: new Date().toISOString(),
      }
      return tags[idx]
    },

    async delete(uid: string, tagId: string): Promise<boolean> {
      const idx = tags.findIndex(t => t.id === tagId && t.uid === uid)
      if (idx < 0) return false
      tags.splice(idx, 1)
      return true
    },
  }
}
