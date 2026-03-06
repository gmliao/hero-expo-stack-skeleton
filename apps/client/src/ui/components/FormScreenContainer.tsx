import type { ReactNode } from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollContainer } from '@/ui/components/KeyboardAwareScrollContainer'
import { cn } from '@/ui/utils/cn'

type FormScreenContainerProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function FormScreenContainer({
  children,
  className,
  contentClassName,
}: FormScreenContainerProps) {
  return (
    <KeyboardAwareScrollContainer className={className}>
      <View className={cn('flex-1 items-center px-5 py-8', contentClassName)}>{children}</View>
    </KeyboardAwareScrollContainer>
  )
}
