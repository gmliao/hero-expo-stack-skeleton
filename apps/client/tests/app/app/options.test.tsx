import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import OptionsScreen from '../../../app/(app)/options'
import { useAuthStore } from '@/stores/useAuthStore'
import { router } from 'expo-router'
import { firebaseAuth } from '@/lib/firebase'

describe('OptionsScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ uid: 'user-1' })
    jest.mocked(router.replace).mockClear()
    jest.mocked(router.push).mockClear()
    jest.mocked(firebaseAuth.signOut).mockResolvedValue(undefined)
  })

  it('renders title, manage tags link, and logout button', () => {
    render(<OptionsScreen />)
    expect(screen.getByTestId('options-title')).toBeOnTheScreen()
    expect(screen.getByTestId('options-manage-tags')).toBeOnTheScreen()
    expect(screen.getByTestId('options-logout')).toBeOnTheScreen()
    expect(screen.getByTestId('options-back')).toBeOnTheScreen()
  })

  it('on Manage tags press calls router.push to manage-tags', () => {
    render(<OptionsScreen />)
    fireEvent.press(screen.getByTestId('options-manage-tags'))
    expect(router.push).toHaveBeenCalledWith('/(app)/manage-tags')
  })

  it('on logout success calls signOut, setUid(null), router.replace to login', async () => {
    render(<OptionsScreen />)
    fireEvent.press(screen.getByTestId('options-logout'))
    await waitFor(() => {
      expect(firebaseAuth.signOut).toHaveBeenCalled()
      expect(useAuthStore.getState().uid).toBeNull()
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login')
    })
  })

  it('on logout failure does not clear uid or redirect, shows error', async () => {
    jest.mocked(firebaseAuth.signOut).mockRejectedValueOnce(new Error('signOut failed'))
    render(<OptionsScreen />)
    fireEvent.press(screen.getByTestId('options-logout'))
    await waitFor(() => {
      expect(useAuthStore.getState().uid).toBe('user-1')
      expect(router.replace).not.toHaveBeenCalled()
    })
    expect(screen.getByTestId('options-logout-error')).toBeOnTheScreen()
    expect(screen.getByTestId('options-logout-error')).toHaveTextContent('options.logoutFailed')
  })
})
