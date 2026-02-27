import { type ViewProps, View } from 'react-native'
import { useBreakpoint } from '@/lib/useBreakpoint'
import { cn } from '@/ui/utils/cn'

/** Default max width for app screen content (desktop). Matches (app)/index.tsx CONTENT_MAX_WIDTH. */
export const SCREEN_CONTENT_MAX_WIDTH = 720

interface AppScreenContainerProps extends ViewProps {
  /** Max width when breakpoint is desktop. Default 720. */
  maxWidth?: number
  className?: string
}

/**
 * Wraps screen content so width is consistent: full width on mobile/tablet,
 * centered with max-width on desktop. Use for (app) routes to avoid one screen being wider than others.
 */
export function AppScreenContainer({
  maxWidth = SCREEN_CONTENT_MAX_WIDTH,
  className,
  style,
  ...props
}: AppScreenContainerProps) {
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  return (
    <View
      className={cn('flex-1 w-full self-center', className)}
      style={[{ minHeight: 0 }, isDesktop && { maxWidth }, style]}
      {...props}
    />
  )
}
