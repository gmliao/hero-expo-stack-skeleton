import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppTagChip } from '@/ui/components/AppTagChip'

describe('AppTagChip', () => {
  it('renders emoji and tag name', () => {
    render(<AppTagChip name="Work" emoji="🧰" colorToken="tagTeal" />)
    expect(screen.getByText('🧰 Work')).toBeOnTheScreen()
  })

  it('marks selected state through accessibility when active', () => {
    render(<AppTagChip name="Urgent" emoji="⚡" colorToken="tagAmber" active />)
    expect(screen.getByTestId('tag-chip')).toHaveProp('accessibilityState', { selected: true })
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    render(<AppTagChip name="Personal" emoji="🏠" colorToken="tagBlue" onPress={onPress} />)
    fireEvent.press(screen.getByTestId('tag-chip'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
