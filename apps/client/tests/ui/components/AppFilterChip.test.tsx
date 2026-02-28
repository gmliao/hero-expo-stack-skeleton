import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppFilterChip } from '@/ui/components/AppFilterChip'

describe('AppFilterChip', () => {
  it('renders label', () => {
    render(<AppFilterChip>All</AppFilterChip>)
    expect(screen.getByText('All')).toBeOnTheScreen()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    render(<AppFilterChip onPress={onPress}>Active</AppFilterChip>)
    fireEvent.press(screen.getByText('Active'))
    expect(onPress).toHaveBeenCalled()
  })

  it('active renders selected state', () => {
    render(<AppFilterChip active>Selected</AppFilterChip>)
    expect(screen.getByText('Selected')).toBeOnTheScreen()
    expect(screen.getByRole('button').props.accessibilityState?.selected).toBe(true)
  })
})
