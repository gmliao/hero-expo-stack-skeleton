import { render, screen } from '@testing-library/react-native'
import { AppTagBadge } from '@/ui/components/AppTagBadge'

describe('AppTagBadge', () => {
  it('renders tag name via name prop', () => {
    render(<AppTagBadge name="Work" />)
    expect(screen.getByText('Work')).toBeOnTheScreen()
  })

  it('renders tag name via children', () => {
    render(<AppTagBadge>Personal</AppTagBadge>)
    expect(screen.getByText('Personal')).toBeOnTheScreen()
  })

  it('uses custom testID when provided', () => {
    render(<AppTagBadge name="Urgent" testID="custom-tag-badge" />)
    expect(screen.getByTestId('custom-tag-badge')).toBeOnTheScreen()
    expect(screen.getByText('Urgent')).toBeOnTheScreen()
  })

  it('exposes accessibility label from name', () => {
    render(<AppTagBadge name="Work" />)
    const badge = screen.getByTestId('tag-badge')
    expect(badge.props.accessibilityLabel).toBe('Work')
  })

  it('uses custom accessibilityLabel when provided', () => {
    render(<AppTagBadge name="Work" accessibilityLabel="Tag: Work" />)
    const badge = screen.getByTestId('tag-badge')
    expect(badge.props.accessibilityLabel).toBe('Tag: Work')
  })
})
