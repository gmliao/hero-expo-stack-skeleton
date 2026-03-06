import { act, fireEvent, render, screen } from '@testing-library/react-native'
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

  it('applies a minimum sheet height so the body and footer can coexist on mobile', () => {
    render(
      <ModalFormSheet visible onClose={jest.fn()} testID="modal-form-sheet">
        <Text>Body</Text>
      </ModalFormSheet>,
    )

    expect(screen.getByTestId('modal-form-sheet')).toHaveProp(
      'className',
      expect.stringContaining('min-h-[360px]'),
    )
  })

  it('supports centered dialog placement for form modals', () => {
    render(
      <ModalFormSheet
        visible
        onClose={jest.fn()}
        placement="center"
        testID="modal-form-sheet"
      >
        <Text>Body</Text>
      </ModalFormSheet>,
    )

    expect(screen.getByTestId('modal-form-sheet')).toHaveProp(
      'className',
      expect.stringContaining('rounded-3xl'),
    )
    expect(screen.getByTestId('modal-form-sheet')).toHaveProp(
      'className',
      expect.not.stringContaining('min-h-[360px]'),
    )
  })

  it('dismisses keyboard before closing on request close when keyboard is visible', () => {
    ;(Platform as any).OS = 'ios'
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

  it('dismisses keyboard before closing when pressing the overlay', () => {
    ;(Platform as any).OS = 'ios'
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
    fireEvent.press(screen.getByTestId('modal-form-sheet-overlay'))

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
