import { View, type ViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cn } from '@/ui/utils/cn'

interface AppStatusBarProps extends ViewProps {
  className?: string
}

export function AppStatusBar({ className, style, ...props }: AppStatusBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      {...props}
      style={[{ paddingTop: insets.top, minHeight: insets.top || 24 }, style]}
      className={cn('bg-surface', className)}
    />
  )
}
