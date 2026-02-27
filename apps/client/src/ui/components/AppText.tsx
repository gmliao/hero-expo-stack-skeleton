import { Text, type TextProps } from 'react-native'
import { cn } from '@/ui/utils/cn'

type AppTextTone = 'default' | 'muted' | 'danger' | 'success' | 'inverse'
type AppTextSize = 'sm' | 'md' | 'lg' | 'xl'
type AppTextWeight = 'normal' | 'medium' | 'semibold' | 'bold'

const toneClass: Record<AppTextTone, string> = {
  default: 'text-text',
  muted: 'text-muted',
  danger: 'text-danger',
  success: 'text-success',
  inverse: 'text-white',
}

const sizeClass: Record<AppTextSize, string> = {
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
  xl: 'text-xl',
}

const weightClass: Record<AppTextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

interface AppTextProps extends TextProps {
  tone?: AppTextTone
  size?: AppTextSize
  weight?: AppTextWeight
  className?: string
}

export function AppText({
  tone = 'default',
  size = 'md',
  weight = 'normal',
  className,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      className={cn(toneClass[tone], sizeClass[size], weightClass[weight], className)}
    />
  )
}
