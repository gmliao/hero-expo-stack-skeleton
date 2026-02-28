import { render, screen } from '@testing-library/react-native'
import { AppScreenContainer } from '@/ui/components/AppScreenContainer'

jest.mock('@/lib/useBreakpoint', () => ({
  useBreakpoint: () => 'mobile',
}))

describe('AppScreenContainer', () => {
  it('renders with testID', () => {
    render(<AppScreenContainer testID="container">Content</AppScreenContainer>)
    expect(screen.getByTestId('container')).toBeOnTheScreen()
  })
})
