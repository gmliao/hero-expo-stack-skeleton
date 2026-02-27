import { Pressable, type PressableProps } from 'react-native'
import { AppText } from './AppText'
import { cn } from '@/ui/utils/cn'

interface AppFilterChipProps extends Omit<PressableProps, 'children'> {
  children: string
  active?: boolean
  className?: string
}

export function AppFilterChip({
  children,
  active = false,
  className,
  ...props
}: AppFilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={cn(
        'items-center justify-center rounded-md border px-4 py-2',
        active ? 'border-primary bg-primary' : 'border-border bg-transparent',
        className,
      )}
      {...props}
    >
      <AppText
        size="sm"
        weight="medium"
        tone={active ? 'inverse' : 'muted'}
      >
        {children}
      </AppText>
    </Pressable>
  )
}
