import { Platform } from 'react-native'

const required = (key: string): string => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }

  return value
}

export const env = {
  FIREBASE_PROJECT_ID: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  FIREBASE_API_KEY: required('EXPO_PUBLIC_FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  USE_EMULATOR: process.env.EXPO_PUBLIC_USE_EMULATOR === 'true',
  AUTH_EMULATOR_HOST: process.env.EXPO_PUBLIC_AUTH_EMULATOR_HOST,
  FUNCTIONS_URL:
    process.env.EXPO_PUBLIC_FUNCTIONS_URL ??
    `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:5001`,
}
