import { useAuthStore } from '@/stores/useAuthStore'

beforeEach(() => {
  useAuthStore.setState({ uid: null })
})

describe('useAuthStore', () => {
  it('has uid null by default', () => {
    expect(useAuthStore.getState().uid).toBeNull()
  })

  it('setUid updates uid', () => {
    useAuthStore.getState().setUid('user-123')
    expect(useAuthStore.getState().uid).toBe('user-123')
  })

  it('setUid(null) clears uid', () => {
    useAuthStore.getState().setUid('user-123')
    useAuthStore.getState().setUid(null)
    expect(useAuthStore.getState().uid).toBeNull()
  })
})
