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
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
}

export interface UpdateTodoRequest {
  completed?: boolean;
  title?: string;
  description?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}
