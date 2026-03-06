import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { cn } from '@/ui/utils/cn'

type KeyboardAwareScrollContainerProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  keyboardVerticalOffset?: number
}

export function KeyboardAwareScrollContainer({
  children,
  className,
  contentClassName,
  keyboardVerticalOffset = 0,
}: KeyboardAwareScrollContainerProps) {
  return (
    <KeyboardAvoidingView
      className={cn('flex-1', className)}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View className={cn('flex-1', contentClassName)}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
