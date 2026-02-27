import { primitiveTokens } from '@/ui/theme/tokens'

describe('primitiveTokens', () => {
  it('exposes required token groups', () => {
    expect(primitiveTokens).toHaveProperty('colors')
    expect(primitiveTokens).toHaveProperty('spacing')
    expect(primitiveTokens).toHaveProperty('radii')
    expect(primitiveTokens).toHaveProperty('typography')
    expect(primitiveTokens).toHaveProperty('shadow')
    expect(primitiveTokens).toHaveProperty('zIndex')
    expect(primitiveTokens).toHaveProperty('motion')
  })
})

