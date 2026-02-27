import { create } from 'zustand'

export type Filter = 'all' | 'active' | 'completed'

type UIState = {
  filter: Filter
  selectedTodoId: string | null
  isCreateModalOpen: boolean
  banner: string | null
  setFilter: (filter: Filter) => void
  setSelectedTodoId: (todoId: string | null) => void
  openCreateModal: () => void
  closeCreateModal: () => void
  showBanner: (message: string) => void
  clearBanner: () => void
}

export const useUIStore = create<UIState>((set) => ({
  filter: 'all',
  selectedTodoId: null,
  isCreateModalOpen: false,
  banner: null,
  setFilter: (filter) => set({ filter }),
  setSelectedTodoId: (todoId) => set({ selectedTodoId: todoId }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  showBanner: (message) => set({ banner: message }),
  clearBanner: () => set({ banner: null }),
}))
