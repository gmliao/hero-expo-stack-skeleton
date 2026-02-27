import { View, type ViewProps } from 'react-native'
import { cn } from '@/ui/utils/cn'

interface AppSheetHandleProps extends ViewProps {
  className?: string
}

export function AppSheetHandle({ className, ...props }: AppSheetHandleProps) {
  return (
    <View
      {...props}
      className={cn('h-1 w-12 rounded-full bg-muted self-center', className)}
    />
  )
}
