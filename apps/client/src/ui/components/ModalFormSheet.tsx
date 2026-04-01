import type { ReactNode } from 'react'
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
  placement?: 'bottom' | 'center'
}

export function ModalFormSheet({
  visible,
  onClose,
  children,
  footer,
  maxWidth,
  testID,
  placement = 'bottom',
}: ModalFormSheetProps) {
  function handleDismissAttempt() {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss()
      return
    }
    onClose()
  }

  const body = (
    <KeyboardAwareScrollContainer className="flex-1" contentClassName="pb-2" context="modal">
      <View className="flex-1">{children}</View>
    </KeyboardAwareScrollContainer>
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismissAttempt}>
      <View
        className={cn(
          'flex-1 bg-overlay',
          placement === 'center' ? 'justify-center px-4 py-6' : 'justify-end',
        )}
      >
        <Pressable
          testID="modal-form-sheet-overlay"
          className="absolute inset-0"
          onPress={handleDismissAttempt}
        />
        <View
          testID={testID}
          className={cn(
            placement === 'center'
              ? 'w-full max-h-[80%] rounded-3xl border border-border bg-surface px-5 py-4'
              : 'w-full min-h-[360px] max-h-[85%] rounded-t-lg border border-border bg-surface px-5 py-4',
          )}
          style={maxWidth ? { maxWidth, alignSelf: 'center' } : undefined}
        >
          <AppSheetHandle className="mb-4" />
          {body}
          {footer ? <View className="border-t border-border pt-4">{footer}</View> : null}
        </View>
      </View>
    </Modal>
  )
}
