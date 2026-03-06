import { render, screen } from '@testing-library/react-native'
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native'
import { KeyboardAwareScrollContainer } from '@/ui/components/KeyboardAwareScrollContainer'

describe('KeyboardAwareScrollContainer', () => {
  const originalOS = Platform.OS

  afterEach(() => {
    ;(Platform as any).OS = originalOS
  })

  it('renders children inside the scroll container', () => {
    render(
      <KeyboardAwareScrollContainer>
        <Text testID="body">Form body</Text>
      </KeyboardAwareScrollContainer>,
    )

    expect(screen.getByTestId('body')).toBeOnTheScreen()
  })

  it('uses keyboard avoiding padding on ios', () => {
    ;(Platform as any).OS = 'ios'

    const { UNSAFE_getByType } = render(
      <KeyboardAwareScrollContainer>
        <Text>Body</Text>
      </KeyboardAwareScrollContainer>,
    )

    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding')
  })

  it('uses handled taps and flex-grow body content by default', () => {
    const { UNSAFE_getByType } = render(
      <KeyboardAwareScrollContainer>
        <Text>Body</Text>
      </KeyboardAwareScrollContainer>,
    )

    const scrollView = UNSAFE_getByType(ScrollView)
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled')
    expect(scrollView.props.contentContainerStyle).toEqual({ flexGrow: 1 })
  })

  it('renders safely on web without ios-only behavior', () => {
    ;(Platform as any).OS = 'web'

    const { UNSAFE_getByType } = render(
      <KeyboardAwareScrollContainer>
        <Text testID="body">Web body</Text>
      </KeyboardAwareScrollContainer>,
    )

    expect(screen.getByTestId('body')).toBeOnTheScreen()
    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBeUndefined()
  })
})
