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
}

export interface CreateTodoRequest {
  title: string
  description?: string
  dueDate?: string
}

export interface UpdateTodoRequest {
  completed?: boolean
  title?: string
  description?: string
  dueDate?: string
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
