import { ReactNode } from 'react'
import { config } from '@gluestack-ui/config'
import { GluestackUIProvider as Provider } from '@gluestack-ui/themed'

interface Props {
  children: ReactNode
}

export function GluestackUIProvider({ children }: Props) {
  return <Provider config={config}>{children}</Provider>
}
