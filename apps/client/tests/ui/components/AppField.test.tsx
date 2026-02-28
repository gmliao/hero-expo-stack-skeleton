import { render, screen } from '@testing-library/react-native'
import { AppField } from '@/ui/components/AppField'
import { AppInput } from '@/ui/components/AppInput'

describe('AppField', () => {
  it('renders label and children', () => {
    render(
      <AppField label="Email">
        <AppInput testID="input" />
      </AppField>,
    )
    expect(screen.getByText('Email')).toBeOnTheScreen()
    expect(screen.getByTestId('input')).toBeOnTheScreen()
  })

  it('shows required asterisk when required', () => {
    render(<AppField label="Name" required><AppInput testID="input" /></AppField>)
    expect(screen.getByText(/Name \*/)).toBeOnTheScreen()
  })

  it('shows error when error prop provided', () => {
    render(
      <AppField label="Field" error="This field is required">
        <AppInput testID="input" />
      </AppField>,
    )
    expect(screen.getByText('This field is required')).toBeOnTheScreen()
  })
})
