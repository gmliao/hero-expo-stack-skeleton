module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: { statements: 0, branches: 0, functions: 0, lines: 0 },
    'src/handlers/**/*.ts': { statements: 65, branches: 45, functions: 65, lines: 65 },
    'src/middleware/**/*.ts': { statements: 65, branches: 55, functions: 65, lines: 65 },
  },
}
