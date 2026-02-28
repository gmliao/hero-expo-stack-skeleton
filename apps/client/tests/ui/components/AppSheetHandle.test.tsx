import { render, screen } from '@testing-library/react-native'
import { AppSheetHandle } from '@/ui/components/AppSheetHandle'

describe('AppSheetHandle', () => {
  it('renders', () => {
    render(<AppSheetHandle testID="sheet-handle" />)
    expect(screen.getByTestId('sheet-handle')).toBeOnTheScreen()
  })
})
