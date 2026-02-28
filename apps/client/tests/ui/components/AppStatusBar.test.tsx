import { render, screen } from '@testing-library/react-native'
import { AppStatusBar } from '@/ui/components/AppStatusBar'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

describe('AppStatusBar', () => {
  it('renders', () => {
    render(<AppStatusBar testID="status-bar" />)
    expect(screen.getByTestId('status-bar')).toBeOnTheScreen()
  })
})
