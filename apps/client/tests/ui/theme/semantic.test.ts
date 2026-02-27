import { semanticColors } from '@/ui/theme/semantic'

const requiredKeys = [
  'bg',
  'surface',
  'text',
  'muted',
  'primary',
  'danger',
  'success',
  'border',
  'focus',
] as const

describe('semanticColors', () => {
  it('contains required light and dark semantic keys', () => {
    for (const key of requiredKeys) {
      expect(semanticColors.light).toHaveProperty(key)
      expect(semanticColors.dark).toHaveProperty(key)
    }
  })
})

