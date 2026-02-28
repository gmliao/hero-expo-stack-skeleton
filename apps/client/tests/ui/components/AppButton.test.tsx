import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppButton } from '@/ui/components/AppButton'

describe('AppButton', () => {
  it('renders label and is pressable', () => {
    const onPress = jest.fn()
    render(<AppButton onPress={onPress}>Submit</AppButton>)
    expect(screen.getByText('Submit')).toBeOnTheScreen()
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalled()
  })

  it('renders with variant primary by default', () => {
    render(<AppButton>Save</AppButton>)
    expect(screen.getByText('Save')).toBeOnTheScreen()
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    render(<AppButton disabled onPress={onPress}>Submit</AppButton>)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows loading state (no text, no onPress)', () => {
    const onPress = jest.fn()
    render(<AppButton isLoading onPress={onPress}>Submit</AppButton>)
    expect(screen.queryByText('Submit')).toBeNull()
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('state error uses destructive variant', () => {
    render(<AppButton state="error">Error</AppButton>)
    expect(screen.getByText('Error')).toBeOnTheScreen()
  })
})
