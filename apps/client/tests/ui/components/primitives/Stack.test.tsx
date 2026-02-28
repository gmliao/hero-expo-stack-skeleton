import { render, screen } from '@testing-library/react-native'
import { UIStack } from '@/ui/components/primitives/Stack'

describe('UIStack (primitives/Stack)', () => {
  it('renders with testID', () => {
    render(<UIStack testID="stack" />)
    expect(screen.getByTestId('stack')).toBeOnTheScreen()
  })

  it('renders with gap and direction', () => {
    render(<UIStack gap={4} direction="horizontal" testID="row" />)
    expect(screen.getByTestId('row')).toBeOnTheScreen()
  })
})
