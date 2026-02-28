import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { signInWithEmailAndPassword } from 'firebase/auth'
import LoginScreen from '../../../app/(auth)/login'
import { useAuthStore } from '@/stores/useAuthStore'
import { router } from 'expo-router'

describe('LoginScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ uid: null })
    jest.mocked(signInWithEmailAndPassword).mockReset()
    jest.mocked(router.replace).mockClear()
  })

  it('renders LoginForm with email and password inputs', () => {
    render(<LoginScreen />)
    expect(screen.getByTestId('email-input')).toBeOnTheScreen()
    expect(screen.getByTestId('password-input')).toBeOnTheScreen()
    expect(screen.getByTestId('login-button')).toBeOnTheScreen()
  })

  it('on success calls setUid and router.replace', async () => {
    jest.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: { uid: 'new-uid' },
    } as never)
    render(<LoginScreen />)
    fireEvent.changeText(screen.getByTestId('email-input'), 'u@e.com')
    fireEvent.changeText(screen.getByTestId('password-input'), 'pass')
    fireEvent.press(screen.getByTestId('login-button'))
    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(useAuthStore.getState().uid).toBe('new-uid')
      expect(router.replace).toHaveBeenCalledWith('/(app)')
    })
  })

  it('on error shows error in form', async () => {
    jest.mocked(signInWithEmailAndPassword).mockRejectedValue(new Error('auth/invalid-credential'))
    render(<LoginScreen />)
    fireEvent.changeText(screen.getByTestId('email-input'), 'u@e.com')
    fireEvent.changeText(screen.getByTestId('password-input'), 'wrong')
    fireEvent.press(screen.getByTestId('login-button'))
    expect(await screen.findByTestId('login-error')).toBeOnTheScreen()
  })
})
