import { createAnimations } from '@tamagui/animations-react-native'
import { createTamagui } from 'tamagui'
import { nunitoSansFont, varelaRoundFont } from './theme/fonts'
import { lightTheme, darkTheme } from './theme/themes'
import { tokens } from './theme/tokens'

const animations = createAnimations({
  quick: { type: 'spring', damping: 20, mass: 1, stiffness: 200 },
  bouncy: { type: 'spring', damping: 10, mass: 1, stiffness: 100 },
  lazy: { type: 'spring', damping: 20, mass: 1, stiffness: 60 },
})

export const tamaguiConfig = createTamagui({
  animations,
  fonts: { body: nunitoSansFont, heading: varelaRoundFont },
  tokens,
  themes: { light: lightTheme, dark: darkTheme },
  shouldAddPrefersColorSchemes: true,
  themeClassNameOnRoot: false,
})

export default tamaguiConfig

type AppTamaguiConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
