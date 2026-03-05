import { Platform } from 'react-native'

const required = (key: string, value?: string): string => {
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

const projectId = required('EXPO_PUBLIC_FIREBASE_PROJECT_ID', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID)
const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
const emulatorBase = `http://${host}:5001/${projectId}/us-central1`

// Functions v2 emulator requires /projectId/region in path. Normalize if user set bare :5001.
const rawFunctionsUrl =
  process.env.EXPO_PUBLIC_FUNCTIONS_URL ??
  (process.env.EXPO_PUBLIC_USE_EMULATOR === 'true' ? emulatorBase : `http://${host}:5001`)
const isEmulator = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true'
const isBarePort = /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2):5001\/?$/i.test(rawFunctionsUrl.replace(/\/$/, ''))
const FUNCTIONS_URL = isEmulator && isBarePort ? emulatorBase : rawFunctionsUrl

export const env = {
  FIREBASE_PROJECT_ID: projectId,
  FIREBASE_API_KEY: required('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  FIREBASE_AUTH_DOMAIN: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  USE_EMULATOR: isEmulator,
  AUTH_EMULATOR_HOST: process.env.EXPO_PUBLIC_AUTH_EMULATOR_HOST,
  FUNCTIONS_URL,
}
