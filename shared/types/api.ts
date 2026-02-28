// shared/types/api.ts
// This is the single source of truth for app ↔ backend contracts.
// Both app/src/data/api.ts and backend functions import from here.

export interface Todo {
  id: string;
  uid: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string; // ISO string (Firestore Timestamp serialized)
  updatedAt: string;
  dueDate?: string; // ISO or date-only (YYYY-MM-DD)
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTodoRequest {
  completed?: boolean;
  title?: string;
  description?: string;
  /** Set to null to clear due date; omit to leave unchanged */
  dueDate?: string | null;
}

export interface ApiError {
  error: string;
  code?: string;
}

/** Success response DTO */
export interface SuccessDto<T> {
  success: true;
  data: T;
}

/** Failure response DTO */
export interface FailureDto {
  success: false;
  error: string;
  code?: string;
  message?: string;
}

/** API response: either success with data or failure with error */
export type ApiResponseDto<T> = SuccessDto<T> | FailureDto;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}
