import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { LoginForm } from '@/features/auth/LoginForm'
import { router } from 'expo-router'

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))

const mockFormScreenContainer = jest.fn(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
)

jest.mock('@/ui/components', () => {
  const actual = jest.requireActual('@/ui/components')
  return {
    ...actual,
    FormScreenContainer: (props: { children: React.ReactNode }) =>
      mockFormScreenContainer(props),
  }
})

describe('LoginForm', () => {
  it('renders sign-in title and inputs', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    expect(screen.getByText('auth.signInTitle')).toBeOnTheScreen()
    expect(screen.getByTestId('email-input')).toBeOnTheScreen()
    expect(screen.getByTestId('password-input')).toBeOnTheScreen()
    expect(screen.getByTestId('login-button')).toBeOnTheScreen()
    expect(screen.getByTestId('login-link-sign-up')).toBeOnTheScreen()
    expect(mockFormScreenContainer).toHaveBeenCalled()
  })

  it('does not call onSubmit when email and password are empty and shows fieldsRequired error', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.press(screen.getByTestId('login-button'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('login-error')).toBeOnTheScreen()
    expect(screen.getByText('auth.fieldsRequired')).toBeOnTheScreen()
  })

  it('does not call onSubmit when only email is filled and shows fieldsRequired error', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('email-input'), 'a@b.com')
    fireEvent.press(screen.getByTestId('login-button'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('login-error')).toBeOnTheScreen()
    expect(screen.getByText('auth.fieldsRequired')).toBeOnTheScreen()
  })

  it('calls onSubmit with email and password when both filled', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com')
    fireEvent.changeText(screen.getByTestId('password-input'), 'secret')
    fireEvent.press(screen.getByTestId('login-button'))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'secret')
    })
  })

  it('calls onSubmit with trimmed email when email has leading/trailing spaces', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('email-input'), ' user@example.com ')
    fireEvent.changeText(screen.getByTestId('password-input'), 'secret')
    fireEvent.press(screen.getByTestId('login-button'))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'secret')
    })
  })

  it('shows error when onSubmit returns error', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ error: 'Invalid credentials' })
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('email-input'), 'u@e.com')
    fireEvent.changeText(screen.getByTestId('password-input'), 'pass')
    fireEvent.press(screen.getByTestId('login-button'))
    expect(await screen.findByTestId('login-error')).toBeOnTheScreen()
    expect(screen.getByText('Invalid credentials')).toBeOnTheScreen()
  })

  it('navigates to sign-up when login-link-sign-up is pressed', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.press(screen.getByTestId('login-link-sign-up'))
    expect(router.push).toHaveBeenCalledWith('/(auth)/sign-up')
  })

  it('submits when password input triggers submitEditing with valid data', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('email-input'), 'user@example.com')
    fireEvent.changeText(screen.getByTestId('password-input'), 'secret')
    fireEvent(screen.getByTestId('password-input'), 'submitEditing')
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'secret')
    })
  })
})
