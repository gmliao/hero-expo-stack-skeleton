import { render, screen } from '@testing-library/react-native'
import { AppStack } from '@/ui/components/AppStack'

describe('AppStack', () => {
  it('renders with testID', () => {
    render(<AppStack testID="stack" />)
    expect(screen.getByTestId('stack')).toBeOnTheScreen()
  })

  it('renders with gap', () => {
    render(<AppStack gap={4} testID="stack" />)
    expect(screen.getByTestId('stack')).toBeOnTheScreen()
  })

  it('renders horizontal direction', () => {
    render(<AppStack direction="horizontal" testID="row" />)
    expect(screen.getByTestId('row')).toBeOnTheScreen()
  })
})
