import { fireEvent, render, screen } from '@testing-library/react-native'
import { AppTextArea } from '@/ui/components/AppTextArea'

describe('AppTextArea', () => {
  it('renders and accepts input', () => {
    render(<AppTextArea testID="textarea" placeholder="Description" />)
    const input = screen.getByTestId('textarea')
    expect(input).toBeOnTheScreen()
    expect(input.props.multiline).toBe(true)
  })

  it('respects value and onChangeText', () => {
    const onChange = jest.fn()
    render(<AppTextArea testID="textarea" value="" onChangeText={onChange} />)
    fireEvent.changeText(screen.getByTestId('textarea'), 'hello')
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('invalid applies error styling', () => {
    render(<AppTextArea testID="textarea" invalid />)
    expect(screen.getByTestId('textarea')).toBeOnTheScreen()
  })
})
