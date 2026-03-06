import { useEffect, useState, type ReactNode } from 'react'
import { Keyboard, Modal, Platform, Pressable, View } from 'react-native'
import { KeyboardAwareScrollContainer } from '@/ui/components/KeyboardAwareScrollContainer'
import { AppSheetHandle } from '@/ui/components/AppSheetHandle'
import { cn } from '@/ui/utils/cn'

type ModalFormSheetProps = {
  visible: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: number
  testID?: string
}

export function ModalFormSheet({
  visible,
  onClose,
  children,
  footer,
  maxWidth,
  testID,
}: ModalFormSheetProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true)
    })
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  function handleRequestClose() {
    if (Platform.OS === 'android' && isKeyboardVisible) {
      Keyboard.dismiss()
      return
    }

    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleRequestClose}>
      <View className="flex-1 justify-end bg-overlay">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View
          testID={testID}
          className={cn('w-full max-h-[85%] rounded-t-lg border border-border bg-surface px-5 py-4')}
          style={maxWidth ? { maxWidth, alignSelf: 'center' } : undefined}
        >
          <AppSheetHandle className="mb-4" />
          <KeyboardAwareScrollContainer className="flex-1">
            <View className="flex-1">{children}</View>
          </KeyboardAwareScrollContainer>
          {footer ? <View className="border-t border-border pt-4">{footer}</View> : null}
        </View>
      </View>
    </Modal>
  )
}
