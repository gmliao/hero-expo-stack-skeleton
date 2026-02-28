import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import OptionsScreen from '../../../app/(app)/options'
import { useAuthStore } from '@/stores/useAuthStore'
import { router } from 'expo-router'
import { firebaseAuth } from '@/lib/firebase'

describe('OptionsScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ uid: 'user-1' })
    jest.mocked(router.replace).mockClear()
  })

  it('renders title and logout button', () => {
    render(<OptionsScreen />)
    expect(screen.getByTestId('options-title')).toBeOnTheScreen()
    expect(screen.getByTestId('options-logout')).toBeOnTheScreen()
    expect(screen.getByTestId('options-back')).toBeOnTheScreen()
  })

  it('on logout calls signOut, setUid(null), router.replace to login', async () => {
    render(<OptionsScreen />)
    fireEvent.press(screen.getByTestId('options-logout'))
    await waitFor(() => {
      expect(firebaseAuth.signOut).toHaveBeenCalled()
      expect(useAuthStore.getState().uid).toBeNull()
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login')
    })
  })
})
