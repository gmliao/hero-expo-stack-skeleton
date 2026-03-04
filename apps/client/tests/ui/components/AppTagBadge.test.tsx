import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppTagBadge } from '@/ui/components/AppTagBadge'

describe('AppTagBadge', () => {
  it('renders emoji and tag name via props', () => {
    render(<AppTagBadge name="Work" emoji="🧰" colorToken="tagTeal" />)
    expect(screen.getByText('🧰 Work')).toBeOnTheScreen()
  })

  it('renders tag name via children', () => {
    render(<AppTagBadge>Personal</AppTagBadge>)
    expect(screen.getByText('Personal')).toBeOnTheScreen()
  })

  it('uses custom testID when provided', () => {
    render(<AppTagBadge name="Urgent" emoji="⚡" colorToken="tagAmber" testID="custom-tag-badge" />)
    expect(screen.getByTestId('custom-tag-badge')).toBeOnTheScreen()
    expect(screen.getByText('⚡ Urgent')).toBeOnTheScreen()
  })

  it('exposes accessibility label from name', () => {
    render(<AppTagBadge name="Work" emoji="🧰" colorToken="tagTeal" />)
    const badge = screen.getByTestId('tag-badge')
    expect(badge.props.accessibilityLabel).toBe('🧰 Work')
  })

  it('uses custom accessibilityLabel when provided', () => {
    render(<AppTagBadge name="Work" emoji="🧰" colorToken="tagTeal" accessibilityLabel="Tag: Work" />)
    const badge = screen.getByTestId('tag-badge')
    expect(badge.props.accessibilityLabel).toBe('Tag: Work')
  })

  it('calls onPress when rendered as interactive badge', () => {
    const onPress = jest.fn()
    render(<AppTagBadge name="Work" emoji="🧰" colorToken="tagTeal" onPress={onPress} />)
    fireEvent.press(screen.getByTestId('tag-badge'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
