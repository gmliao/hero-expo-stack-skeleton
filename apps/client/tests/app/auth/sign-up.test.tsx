import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import SignUpScreen from '../../../app/(auth)/sign-up'
import { useAuthStore } from '@/stores/useAuthStore'
import { router } from 'expo-router'

describe('SignUpScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ uid: null })
    jest.mocked(createUserWithEmailAndPassword).mockReset()
    jest.mocked(router.replace).mockClear()
  })

  it('renders SignUpForm with inputs', () => {
    render(<SignUpScreen />)
    expect(screen.getByTestId('sign-up-email-input')).toBeOnTheScreen()
    expect(screen.getByTestId('sign-up-password-input')).toBeOnTheScreen()
    expect(screen.getByTestId('sign-up-confirm-input')).toBeOnTheScreen()
    expect(screen.getByTestId('sign-up-button')).toBeOnTheScreen()
  })

  it('on success calls setUid and router.replace', async () => {
    jest.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: { uid: 'new-uid' },
    } as never)
    render(<SignUpScreen />)
    fireEvent.changeText(screen.getByTestId('sign-up-email-input'), 'u@e.com')
    fireEvent.changeText(screen.getByTestId('sign-up-password-input'), 'password1')
    fireEvent.changeText(screen.getByTestId('sign-up-confirm-input'), 'password1')
    fireEvent.press(screen.getByTestId('sign-up-button'))
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'u@e.com', 'password1')
    })
    await waitFor(() => {
      expect(useAuthStore.getState().uid).toBe('new-uid')
      expect(router.replace).toHaveBeenCalledWith('/(app)')
    })
  })
})
