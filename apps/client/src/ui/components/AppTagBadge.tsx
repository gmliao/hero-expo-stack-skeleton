import { View, type ViewProps } from 'react-native'
import { AppText } from './AppText'
import { cn } from '@/ui/utils/cn'

export interface AppTagBadgeProps extends ViewProps {
  /** Tag label. Use either `name` or `children`. */
  name?: string
  /** Optional class name for the container. */
  className?: string
}

/**
 * Display-only tag badge: small pill with primarySoft background, border, muted text.
 * Use for showing tag names (e.g. on todo items). Not interactive.
 */
export function AppTagBadge({
  name,
  children,
  className,
  testID = 'tag-badge',
  accessibilityLabel,
  ...props
}: AppTagBadgeProps) {
  const label = name ?? (typeof children === 'string' ? children : '')
  const a11yLabel = accessibilityLabel ?? label

  return (
    <View
      role="text"
      testID={testID}
      accessibilityLabel={a11yLabel}
      className={cn(
        'h-6 min-h-6 flex-row items-center justify-center self-start rounded-full border border-border bg-primary-soft px-3',
        className,
      )}
      {...props}
    >
      <AppText size="sm" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  )
}
