import { Pressable, type PressableProps } from 'react-native'
import type { TagColorToken } from '@shared/types/api'

import { AppText } from './AppText'
import { cn } from '@/ui/utils/cn'
import { tokens } from '@/ui/tokens'

export interface AppTagChipProps extends Omit<PressableProps, 'children'> {
  name: string
  emoji?: string
  colorToken?: TagColorToken
  active?: boolean
  className?: string
}

/**
 * Tag selection chip (32px) with dynamic color from the tag palette.
 *
 * **Layer 3 Exception (styling-governance.md §Layer 3)**
 * `backgroundColor`, `borderColor`, and text `color` are applied via inline `style`
 * because they are driven by runtime `tagPalette` token values that differ per tag instance.
 * NativeWind / Tailwind cannot express dynamic per-instance color tokens statically.
 * This is a rendering-primitive exception, not a token-naming decision.
 */
export function AppTagChip({
  name,
  emoji,
  colorToken = 'tagTeal',
  active = false,
  className,
  testID = 'tag-chip',
  accessibilityLabel,
  ...props
}: AppTagChipProps) {
  const palette = tokens.tagPalette[colorToken]
  const label = emoji ? `${emoji} ${name}` : name

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      className={cn(
        // Layout-only classes; background/border colors are applied via style (Layer 3)
        'h-8 flex-row items-center justify-center rounded-full border px-3',
        className,
      )}
      style={{
        backgroundColor: active ? palette.text : tokens.colors.surface,
        borderColor: active ? palette.text : palette.border,
      }}
      {...props}
    >
      <AppText
        size="sm"
        weight={active ? 'semibold' : 'medium'}
        style={{ color: active ? tokens.colors.white : palette.text }}
      >
        {label}
      </AppText>
    </Pressable>
  )
}
