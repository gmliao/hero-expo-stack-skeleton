import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { SignUpForm } from '@/features/auth/SignUpForm'

describe('SignUpForm', () => {
  it('renders sign-up title and inputs', () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    expect(screen.getByText('auth.signUpTitle')).toBeOnTheScreen()
    expect(screen.getByTestId('sign-up-email-input')).toBeOnTheScreen()
    expect(screen.getByTestId('sign-up-password-input')).toBeOnTheScreen()
    expect(screen.getByTestId('sign-up-confirm-input')).toBeOnTheScreen()
    expect(screen.getByTestId('sign-up-button')).toBeOnTheScreen()
    expect(screen.getByTestId('sign-up-link-login')).toBeOnTheScreen()
  })

  it('shows validation error when password too short', async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('sign-up-email-input'), 'a@b.com')
    fireEvent.changeText(screen.getByTestId('sign-up-password-input'), '12345')
    fireEvent.changeText(screen.getByTestId('sign-up-confirm-input'), '12345')
    fireEvent.press(screen.getByTestId('sign-up-button'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('sign-up-error')).toBeOnTheScreen()
    expect(screen.getByText('auth.weakPassword')).toBeOnTheScreen()
  })

  it('shows validation error when passwords do not match', async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('sign-up-email-input'), 'a@b.com')
    fireEvent.changeText(screen.getByTestId('sign-up-password-input'), 'password')
    fireEvent.changeText(screen.getByTestId('sign-up-confirm-input'), 'other')
    fireEvent.press(screen.getByTestId('sign-up-button'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('auth.passwordMismatch')).toBeOnTheScreen()
  })

  it('calls onSubmit with email and password when valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<SignUpForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('sign-up-email-input'), ' user@example.com ')
    fireEvent.changeText(screen.getByTestId('sign-up-password-input'), 'password1')
    fireEvent.changeText(screen.getByTestId('sign-up-confirm-input'), 'password1')
    fireEvent.press(screen.getByTestId('sign-up-button'))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'password1')
    })
  })

  it('shows error when onSubmit returns error', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ error: 'Email already in use' })
    render(<SignUpForm onSubmit={onSubmit} />)
    fireEvent.changeText(screen.getByTestId('sign-up-email-input'), 'a@b.com')
    fireEvent.changeText(screen.getByTestId('sign-up-password-input'), 'password1')
    fireEvent.changeText(screen.getByTestId('sign-up-confirm-input'), 'password1')
    fireEvent.press(screen.getByTestId('sign-up-button'))
    expect(await screen.findByTestId('sign-up-error')).toBeOnTheScreen()
    expect(screen.getByText('Email already in use')).toBeOnTheScreen()
  })
})
