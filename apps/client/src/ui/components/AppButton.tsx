import { ActivityIndicator, Pressable, type PressableProps } from 'react-native'
import { AppText } from '@/ui/components/AppText'
import { tokens, type AppButtonVariant, type AppComponentSize } from '@/ui/tokens'
import { cn } from '@/ui/utils/cn'

const containerClass: Record<AppButtonVariant, string> = {
  primary: 'bg-primary border border-primary',
  secondary: 'bg-surface border border-border',
  ghost: 'bg-transparent border border-transparent',
  destructive: 'bg-danger border border-danger',
}

const textTone: Record<AppButtonVariant, 'default' | 'inverse'> = {
  primary: 'inverse',
  secondary: 'default',
  ghost: 'default',
  destructive: 'inverse',
}

const sizeClass: Record<AppComponentSize, string> = {
  sm: 'h-9 px-3',
  md: 'h-11 px-4',
  lg: 'h-13 px-5',
}

const textSize: Record<AppComponentSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
}

interface AppButtonProps extends Omit<PressableProps, 'children'> {
  children: string
  variant?: AppButtonVariant
  size?: AppComponentSize
  isLoading?: boolean
  className?: string
  textClassName?: string
}

export function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  textClassName,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'items-center justify-center rounded-md',
        containerClass[variant],
        sizeClass[size],
        isDisabled && 'opacity-60',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={textTone[variant] === 'inverse' ? tokens.colors.white : tokens.colors.text}
        />
      ) : (
        <AppText
          tone={textTone[variant]}
          size={textSize[size]}
          weight="semibold"
          className={textClassName}
        >
          {children}
        </AppText>
      )}
    </Pressable>
  )
}
