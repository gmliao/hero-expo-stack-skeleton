import { View, type ViewProps } from 'react-native'
import { cn } from '@/ui/utils/cn'

type StackDirection = 'vertical' | 'horizontal'
type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

const gapClass: Record<StackGap, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  7: 'gap-7',
  8: 'gap-8',
}

interface AppStackProps extends ViewProps {
  direction?: StackDirection
  gap?: StackGap
  className?: string
}

export function AppStack({ direction = 'vertical', gap = 0, className, ...props }: AppStackProps) {
  return (
    <View
      {...props}
      className={cn(direction === 'horizontal' ? 'flex-row' : 'flex-col', gapClass[gap], className)}
    />
  )
}
