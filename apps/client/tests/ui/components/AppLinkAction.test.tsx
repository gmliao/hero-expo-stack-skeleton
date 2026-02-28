import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppLinkAction } from '@/ui/components/AppLinkAction'

describe('AppLinkAction', () => {
  it('renders label with link role', () => {
    render(<AppLinkAction>Go to sign up</AppLinkAction>)
    expect(screen.getByText('Go to sign up')).toBeOnTheScreen()
    expect(screen.getByRole('link')).toBeOnTheScreen()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    render(<AppLinkAction onPress={onPress}>Link</AppLinkAction>)
    fireEvent.press(screen.getByRole('link'))
    expect(onPress).toHaveBeenCalled()
  })
})
