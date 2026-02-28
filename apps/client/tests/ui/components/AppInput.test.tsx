import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppInput } from '@/ui/components/AppInput'

describe('AppInput', () => {
  it('renders and accepts input', () => {
    render(<AppInput testID="input" placeholder="Email" />)
    const input = screen.getByTestId('input')
    expect(input).toBeOnTheScreen()
    fireEvent.changeText(input, 'a@b.com')
    expect(input.props.value).toBeUndefined()
  })

  it('respects value and onChangeText when controlled', () => {
    const onChange = jest.fn()
    render(<AppInput testID="input" value="hi" onChangeText={onChange} />)
    fireEvent.changeText(screen.getByTestId('input'), 'hello')
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('size md by default', () => {
    render(<AppInput testID="input" />)
    expect(screen.getByTestId('input')).toBeOnTheScreen()
  })

  it('invalid applies error styling', () => {
    render(<AppInput testID="input" invalid />)
    expect(screen.getByTestId('input')).toBeOnTheScreen()
  })

  it('state disabled makes editable false when not passed', () => {
    render(<AppInput testID="input" state="disabled" />)
    expect(screen.getByTestId('input').props.editable).toBe(false)
  })
})
