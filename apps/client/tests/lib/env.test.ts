import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('env module', () => {
  it('does not use dynamic process.env[key] access', () => {
    const envSource = readFileSync(resolve(__dirname, '../../src/lib/env.ts'), 'utf8')
    expect(envSource).not.toContain('process.env[key]')
  })
})
