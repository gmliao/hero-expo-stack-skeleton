import { type ReactNode } from 'react'
import { AppStack } from './AppStack'
import { AppText } from './AppText'
import { cn } from '@/ui/utils/cn'

interface AppFieldProps {
  label: string
  children: ReactNode
  required?: boolean
  error?: string
  className?: string
  labelClassName?: string
}

export function AppField({
  label,
  children,
  required = false,
  error,
  className,
  labelClassName,
}: AppFieldProps) {
  return (
    <AppStack gap={1} className={cn(className)}>
      <AppText size="sm" weight="normal" tone="muted" className={labelClassName}>
        {label}
        {required ? ' *' : ''}
      </AppText>
      {children}
      {error ? (
        <AppText size="sm" tone="danger">
          {error}
        </AppText>
      ) : null}
    </AppStack>
  )
}
