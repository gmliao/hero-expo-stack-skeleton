import { Text, type TextProps } from 'react-native'
import { cn } from '@/ui/utils/cn'

export type TextTone = 'default' | 'muted' | 'danger' | 'success' | 'inverse'
export type TextSize = 'sm' | 'md' | 'lg' | 'xl'
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'

const toneClass: Record<TextTone, string> = {
  default: 'text-text',
  muted: 'text-muted',
  danger: 'text-danger',
  success: 'text-success',
  inverse: 'text-white',
}

const sizeClass: Record<TextSize, string> = {
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
  xl: 'text-xl',
}

const weightClass: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

export interface UITextProps extends TextProps {
  tone?: TextTone
  size?: TextSize
  weight?: TextWeight
  className?: string
}

export function UIText({
  tone = 'default',
  size = 'md',
  weight = 'normal',
  className,
  ...props
}: UITextProps) {
  return (
    <Text
      {...props}
      className={cn(toneClass[tone], sizeClass[size], weightClass[weight], className)}
    />
  )
}
