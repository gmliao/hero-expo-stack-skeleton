import { TextInput, type TextInputProps } from 'react-native'
import { tokens, type AppComponentSize } from '@/ui/tokens'
import { cn } from '@/ui/utils/cn'

const sizeClass: Record<AppComponentSize, string> = {
  sm: 'min-h-20 px-3 py-2 text-sm',
  md: 'min-h-24 px-4 py-3 text-md',
  lg: 'min-h-28 px-4 py-3 text-lg',
}

interface AppTextAreaProps extends TextInputProps {
  size?: AppComponentSize
  invalid?: boolean
  state?: 'default' | 'focused' | 'invalid' | 'success' | 'disabled'
  className?: string
}

export function AppTextArea({
  size = 'md',
  invalid = false,
  state = 'default',
  editable,
  className,
  ...props
}: AppTextAreaProps) {
  const resolvedState = invalid ? 'invalid' : state
  const isDisabled = resolvedState === 'disabled'

  return (
    <TextInput
      {...props}
      multiline
      editable={editable ?? !isDisabled}
      placeholderTextColor={tokens.colors.muted}
      textAlignVertical="top"
      className={cn(
        'rounded-md border bg-surface text-text',
        resolvedState === 'focused' && 'border-2 border-primary',
        resolvedState === 'invalid' && 'border-2 border-danger',
        resolvedState === 'success' && 'border-2 border-success',
        resolvedState === 'default' && 'border-border',
        isDisabled && 'opacity-70',
        sizeClass[size],
        className,
      )}
    />
  )
}
