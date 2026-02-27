import { View, type ViewProps } from 'react-native'
import { cn } from '@/ui/utils/cn'

interface AppCardProps extends ViewProps {
  state?: 'default' | 'hover' | 'focus' | 'error' | 'disabled'
  className?: string
}

export function AppCard({ state = 'default', className, ...props }: AppCardProps) {
  return (
    <View
      {...props}
      className={cn(
        'rounded-md border bg-surface p-4',
        state === 'default' && 'border-border',
        state === 'hover' && 'border-2 border-primary',
        state === 'focus' && 'border-2 border-primary',
        state === 'error' && 'border-2 border-danger',
        state === 'disabled' && 'border-border opacity-60',
        className,
      )}
    />
  )
}
