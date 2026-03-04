import { TextInput, type TextInputProps } from 'react-native'
import { tokens, type AppComponentSize } from '@/ui/tokens'
import { cn } from '@/ui/utils/cn'

const sizeClass: Record<AppComponentSize, string> = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-12 px-4 text-md',
  lg: 'h-14 px-4 text-lg',
}

interface AppInputProps extends TextInputProps {
  size?: AppComponentSize
  invalid?: boolean
  state?: 'default' | 'focused' | 'invalid' | 'success' | 'disabled'
  className?: string
}

export function AppInput({
  size = 'md',
  invalid = false,
  state = 'default',
  editable,
  className,
  ...props
}: AppInputProps) {
  const resolvedState = invalid ? 'invalid' : state
  const isDisabled = resolvedState === 'disabled'

  return (
    <TextInput
      {...props}
      editable={editable ?? !isDisabled}
      placeholderTextColor={tokens.colors.muted}
      className={cn(
        'rounded-md border bg-white text-text',
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
