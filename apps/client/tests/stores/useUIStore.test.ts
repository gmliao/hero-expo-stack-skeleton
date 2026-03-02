import { useUIStore } from '@/stores/useUIStore'

beforeEach(() => {
  useUIStore.setState(useUIStore.getInitialState(), true)
})

describe('useUIStore', () => {
  it('has expected initial values', () => {
    const state = useUIStore.getState()
    expect(state.filter).toBe('all')
    expect(state.selectedTodoId).toBeNull()
    expect(state.selectedTagId).toBeNull()
    expect(state.isCreateModalOpen).toBe(false)
    expect(state.banner).toBeNull()
  })

  it('setFilter updates filter', () => {
    useUIStore.getState().setFilter('active')
    expect(useUIStore.getState().filter).toBe('active')
  })

  it('openCreateModal / closeCreateModal toggle modal', () => {
    useUIStore.getState().openCreateModal()
    expect(useUIStore.getState().isCreateModalOpen).toBe(true)

    useUIStore.getState().closeCreateModal()
    expect(useUIStore.getState().isCreateModalOpen).toBe(false)
  })

  it('showBanner / clearBanner', () => {
    useUIStore.getState().showBanner('Saved!')
    expect(useUIStore.getState().banner).toBe('Saved!')

    useUIStore.getState().clearBanner()
    expect(useUIStore.getState().banner).toBeNull()
  })

  it('setSelectedTodoId', () => {
    useUIStore.getState().setSelectedTodoId('todo-123')
    expect(useUIStore.getState().selectedTodoId).toBe('todo-123')

    useUIStore.getState().setSelectedTodoId(null)
    expect(useUIStore.getState().selectedTodoId).toBeNull()
  })

  it('setSelectedTagId', () => {
    useUIStore.getState().setSelectedTagId('tag-1')
    expect(useUIStore.getState().selectedTagId).toBe('tag-1')

    useUIStore.getState().setSelectedTagId(null)
    expect(useUIStore.getState().selectedTagId).toBeNull()
  })
})
