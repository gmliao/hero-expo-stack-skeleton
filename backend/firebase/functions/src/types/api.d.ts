// Type declarations for Firebase Functions.
// Keep in sync with shared/types/api.ts (the canonical source of truth).

export interface Todo {
  id: string
  uid: string
  title: string
  description?: string
  completed: boolean
  createdAt: string // ISO string (Firestore Timestamp serialized)
  updatedAt: string
  dueDate?: string // ISO or date-only (YYYY-MM-DD)
  tagIds?: string[]
}

export interface CreateTodoRequest {
  title: string
  description?: string
  dueDate?: string
  tagIds?: string[]
}

export interface UpdateTodoRequest {
  completed?: boolean
  title?: string
  description?: string
  /** null = clear due date; omit = leave unchanged */
  dueDate?: string | null
  tagIds?: string[]
}

export interface Tag {
  id: string
  name: string
  uid: string
  createdAt: string
  updatedAt: string
}

export type ListTagsResponse = Tag[]

export interface CreateTagRequest {
  name: string
}

export interface UpdateTagRequest {
  name: string
}

export interface ApiError {
  error: string
  code?: string
}

export interface SuccessDto<T> {
  success: true
  data: T
}

export interface FailureDto {
  success: false
  error: string
  code?: string
  message?: string
}

export type ApiResponseDto<T> = SuccessDto<T> | FailureDto

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  createdAt: string
  updatedAt: string
}
