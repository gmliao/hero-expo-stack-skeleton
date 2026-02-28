import { render, screen } from '@testing-library/react-native'
import { AppText } from '@/ui/components/AppText'

describe('AppText', () => {
  it('renders children', () => {
    render(<AppText>Hello</AppText>)
    expect(screen.getByText('Hello')).toBeOnTheScreen()
  })

  it('renders with size and weight', () => {
    render(<AppText size="lg" weight="bold">Title</AppText>)
    expect(screen.getByText('Title')).toBeOnTheScreen()
  })

  it('renders with tone muted', () => {
    render(<AppText tone="muted">Hint</AppText>)
    expect(screen.getByText('Hint')).toBeOnTheScreen()
  })

  it('renders with tone danger', () => {
    render(<AppText tone="danger">Error</AppText>)
    expect(screen.getByText('Error')).toBeOnTheScreen()
  })
})
