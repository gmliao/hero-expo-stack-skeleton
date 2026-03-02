import type { Tag } from '../../types/api'

export interface ITagsRepository {
  list(uid: string): Promise<Tag[]>
  create(uid: string, name: string): Promise<Tag>
  getById(uid: string, tagId: string): Promise<Tag | null>
  update(tagId: string, uid: string, payload: { name: string }): Promise<Tag | null>
  delete(uid: string, tagId: string): Promise<boolean>
}

// Re-export Tag and request/response types from backend api types (synced with shared/types/api.ts).
export type {
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
  ListTagsResponse,
} from '../../types/api'
