import type { CreateTagRequest, Tag, UpdateTagRequest } from '../../types/api'

export interface ITagsService {
  list(uid: string): Promise<Tag[]>
  create(uid: string, payload: CreateTagRequest): Promise<Tag>
  update(tagId: string, uid: string, payload: UpdateTagRequest): Promise<Tag>
  delete(tagId: string, uid: string): Promise<void>
}

export interface ITagsRepository {
  list(uid: string): Promise<Tag[]>
  create(uid: string, payload: CreateTagRequest): Promise<Tag>
  getById(uid: string, tagId: string): Promise<Tag | null>
  update(tagId: string, uid: string, payload: UpdateTagRequest): Promise<Tag | null>
  delete(uid: string, tagId: string): Promise<boolean>
}

// Re-export Tag and request/response types from backend api types (synced with shared/types/api.ts).
export type {
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
  ListTagsResponse,
} from '../../types/api'
