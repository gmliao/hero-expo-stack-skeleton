import type { ReactNode } from 'react'
import { Pressable, type PressableProps } from 'react-native'
import { AppText } from './AppText'
import { cn } from '@/ui/utils/cn'
import { tokens } from '@/ui/tokens'
import type { TagColorToken } from '@shared/types/api'

export interface AppTagBadgeProps extends Omit<PressableProps, 'children'> {
  /** Tag label. Use either `name` or `children`. */
  name?: string
  /** Optional string child for legacy call sites. */
  children?: ReactNode
  /** Optional tag emoji shown before the label. */
  emoji?: string
  /** DS-controlled color token for the tag. */
  colorToken?: TagColorToken
  /** Interactive selected state for filter usage. */
  active?: boolean
  /** Optional class name for the container. */
  className?: string
}

/**
 * Small tag pill with dynamic color from the tag palette.
 *
 * **Layer 3 Exception (styling-governance.md §Layer 3)**
 * `backgroundColor`, `borderColor`, and text `color` are applied via inline `style`
 * because they are driven by runtime `tagPalette` token values that differ per tag.
 * NativeWind / Tailwind cannot express dynamic per-instance color tokens statically.
 * This is a rendering-primitive exception, not a token-naming decision.
 *
 * The `bg-*` and `border-*` Tailwind classes are intentionally omitted from className
 * to avoid silent overrides by the inline style.
 */
export function AppTagBadge({
  name,
  emoji,
  children,
  colorToken = 'tagTeal',
  active = false,
  className,
  testID = 'tag-badge',
  accessibilityLabel,
  ...props
}: AppTagBadgeProps) {
  const baseLabel = name ?? (typeof children === 'string' ? children : '')
  const label = emoji ? `${emoji} ${baseLabel}` : baseLabel
  const a11yLabel = accessibilityLabel ?? label
  const palette = tokens.tagPalette[colorToken]
  const textColor = active ? tokens.colors.white : palette.text
  const borderColor = active ? palette.text : palette.border
  const backgroundColor = active ? palette.text : palette.bg

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID={testID}
      accessibilityLabel={a11yLabel}
      className={cn(
        // Layout-only classes; background/border colors are applied via style (Layer 3)
        'h-6 min-h-6 flex-row items-center justify-center self-start rounded-full border px-3',
        className,
      )}
      disabled={!props.onPress}
      style={{
        backgroundColor,
        borderColor,
      }}
      {...props}
    >
      <AppText size="sm" numberOfLines={1} style={{ color: textColor }}>
        {label}
      </AppText>
    </Pressable>
  )
}
