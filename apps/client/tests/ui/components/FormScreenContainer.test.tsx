import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

const mockKeyboardAwareScrollContainer = jest.fn(
  ({ children }: { children: React.ReactNode }) => children,
)

jest.mock('@/ui/components/KeyboardAwareScrollContainer', () => ({
  KeyboardAwareScrollContainer: (props: { children: React.ReactNode }) =>
    mockKeyboardAwareScrollContainer(props),
}))

import { FormScreenContainer } from '@/ui/components/FormScreenContainer'

describe('FormScreenContainer', () => {
  it('renders children through the shared keyboard-aware container', () => {
    render(
      <FormScreenContainer>
        <Text>Login form</Text>
      </FormScreenContainer>,
    )

    expect(screen.getByText('Login form')).toBeOnTheScreen()
    expect(mockKeyboardAwareScrollContainer).toHaveBeenCalled()
  })
})
