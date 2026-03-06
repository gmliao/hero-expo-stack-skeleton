import { act, render, screen } from '@testing-library/react-native'
import { Keyboard, Modal, Platform, ScrollView, Text } from 'react-native'
import { ModalFormSheet } from '@/ui/components/ModalFormSheet'

describe('ModalFormSheet', () => {
  const originalOS = Platform.OS
  const keyboardListeners: Record<string, (() => void) | undefined> = {}

  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(keyboardListeners).forEach(key => {
      delete keyboardListeners[key]
    })
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(jest.fn())
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
      keyboardListeners[event] = listener
      return { remove: jest.fn() } as any
    })
  })

  afterEach(() => {
    ;(Platform as any).OS = originalOS
    jest.restoreAllMocks()
  })

  it('renders the body and footer when visible', () => {
    render(
      <ModalFormSheet visible onClose={jest.fn()} footer={<Text>Save</Text>}>
        <Text>Body</Text>
      </ModalFormSheet>,
    )

    expect(screen.getByText('Body')).toBeOnTheScreen()
    expect(screen.getByText('Save')).toBeOnTheScreen()
  })

  it('renders a scrollable body container', () => {
    const { UNSAFE_getByType } = render(
      <ModalFormSheet visible onClose={jest.fn()}>
        <Text>Scrollable body</Text>
      </ModalFormSheet>,
    )

    expect(UNSAFE_getByType(ScrollView)).toBeTruthy()
  })

  it('dismisses keyboard before closing on android request close', () => {
    ;(Platform as any).OS = 'android'
    const onClose = jest.fn()
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss')

    const { UNSAFE_getByType } = render(
      <ModalFormSheet visible onClose={onClose}>
        <Text>Body</Text>
      </ModalFormSheet>,
    )

    act(() => {
      keyboardListeners.keyboardDidShow?.()
    })
    act(() => {
      UNSAFE_getByType(Modal).props.onRequestClose()
    })

    expect(dismissSpy).toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on android request close when keyboard is not visible', () => {
    ;(Platform as any).OS = 'android'
    const onClose = jest.fn()

    const { UNSAFE_getByType } = render(
      <ModalFormSheet visible onClose={onClose}>
        <Text>Body</Text>
      </ModalFormSheet>,
    )

    act(() => {
      UNSAFE_getByType(Modal).props.onRequestClose()
    })

    expect(onClose).toHaveBeenCalled()
  })
})
