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
  className?: string
}

export function AppInput({ size = 'md', invalid = false, className, ...props }: AppInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={tokens.colors.muted}
      className={cn(
        'rounded-md border bg-white text-text',
        invalid ? 'border-danger' : 'border-border',
        sizeClass[size],
        className,
      )}
    />
  )
}
