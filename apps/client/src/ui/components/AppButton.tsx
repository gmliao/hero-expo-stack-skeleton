import { ActivityIndicator, Pressable, type PressableProps } from 'react-native'
import { AppText } from '@/ui/components/AppText'
import { tokens, type AppButtonVariant, type AppComponentSize } from '@/ui/tokens'
import { cn } from '@/ui/utils/cn'

/** Aligned with Pen: PrimaryButton has fill only (no stroke); OutlineButton has border */
const containerClass: Record<AppButtonVariant, string> = {
  primary: 'bg-primary border border-transparent',
  secondary: 'bg-surface border border-border',
  ghost: 'bg-transparent border border-transparent',
  destructive: 'bg-danger border border-transparent',
  outline: 'bg-transparent border border-border',
}

const textTone: Record<AppButtonVariant, 'default' | 'inverse'> = {
  primary: 'inverse',
  secondary: 'default',
  ghost: 'default',
  destructive: 'inverse',
  outline: 'default',
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

/** Spec/Button States 為主：全部 cornerRadius 8、height 44 */
const buttonRadiusClass = 'rounded-sm'

interface AppButtonProps extends Omit<PressableProps, 'children'> {
  children: string
  variant?: AppButtonVariant
  size?: AppComponentSize
  state?: 'default' | 'hover' | 'focus' | 'error' | 'disabled'
  isLoading?: boolean
  className?: string
  textClassName?: string
}

export function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  state = 'default',
  isLoading = false,
  disabled,
  className,
  textClassName,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || isLoading || state === 'disabled'
  const resolvedVariant =
    state === 'error' ? 'destructive' : state === 'hover' ? 'secondary' : variant

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'items-center justify-center',
        buttonRadiusClass,
        containerClass[resolvedVariant],
        sizeClass[size],
        state === 'focus' && 'border-2 border-primary',
        isDisabled && 'opacity-60',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={textTone[resolvedVariant] === 'inverse' ? tokens.colors.white : tokens.colors.text}
        />
      ) : (
        <AppText
          tone={textTone[resolvedVariant]}
          size={textSize[size]}
          weight={resolvedVariant === 'outline' ? 'normal' : 'semibold'}
          className={cn(resolvedVariant === 'outline' && 'text-muted', textClassName)}
        >
          {children}
        </AppText>
      )}
    </Pressable>
  )
}
