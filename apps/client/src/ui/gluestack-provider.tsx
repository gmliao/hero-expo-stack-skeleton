import { ReactNode } from 'react'
import { config } from '@gluestack-ui/config'
import { GluestackUIProvider as Provider } from '@gluestack-ui/themed'

interface Props {
  children: ReactNode
  colorMode?: 'light' | 'dark'
}

export function GluestackUIProvider({ children, colorMode = 'light' }: Props) {
  return (
    <Provider config={config} colorMode={colorMode}>
      {children}
    </Provider>
  )
}
