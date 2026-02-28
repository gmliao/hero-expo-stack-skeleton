import { render, screen } from '@testing-library/react-native'
import { AppCard } from '@/ui/components/AppCard'

describe('AppCard', () => {
  it('renders with testID', () => {
    render(<AppCard testID="card">Content</AppCard>)
    expect(screen.getByTestId('card')).toBeOnTheScreen()
  })

  it('renders with state default', () => {
    render(<AppCard testID="card" />)
    expect(screen.getByTestId('card')).toBeOnTheScreen()
  })

  it('renders with state error', () => {
    render(<AppCard state="error" testID="card" />)
    expect(screen.getByTestId('card')).toBeOnTheScreen()
  })
})
