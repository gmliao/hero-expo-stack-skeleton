import { fireEvent, render, screen } from '@testing-library/react-native'
import { FilterTabs } from '@/features/todos/FilterTabs'

describe('FilterTabs', () => {
  it('renders all filter options', () => {
    const onChange = jest.fn()
    render(<FilterTabs value="all" onChange={onChange} />)
    expect(screen.getByTestId('filter-tab-all')).toBeOnTheScreen()
    expect(screen.getByTestId('filter-tab-active')).toBeOnTheScreen()
    expect(screen.getByTestId('filter-tab-completed')).toBeOnTheScreen()
  })

  it('calls onChange when a tab is pressed', () => {
    const onChange = jest.fn()
    render(<FilterTabs value="all" onChange={onChange} />)
    fireEvent.press(screen.getByTestId('filter-tab-active'))
    expect(onChange).toHaveBeenCalledWith('active')
    fireEvent.press(screen.getByTestId('filter-tab-completed'))
    expect(onChange).toHaveBeenCalledWith('completed')
  })
})
