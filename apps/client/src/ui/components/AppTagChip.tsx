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
