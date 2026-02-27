import { Pressable, type PressableProps } from 'react-native'
import { AppText } from './AppText'
import { cn } from '@/ui/utils/cn'

interface AppLinkActionProps extends Omit<PressableProps, 'children'> {
  children: string
  className?: string
}

export function AppLinkAction({
  children,
  className,
  ...props
}: AppLinkActionProps) {
  return (
    <Pressable
      accessibilityRole="link"
      className={cn('py-1', className)}
      {...props}
    >
      {({ pressed }) => (
        <AppText
          size="md"
          weight="medium"
          tone="default"
          className={cn(
            'text-primary underline',
            pressed && 'opacity-70',
          )}
        >
          {children}
        </AppText>
      )}
    </Pressable>
  )
}
