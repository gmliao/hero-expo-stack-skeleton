import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApps, initializeApp } from 'firebase/app'
import * as FirebaseAuth from 'firebase/auth'
import { Platform } from 'react-native'

import { env } from './env'

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
}

const firebaseApp = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig)

const { connectAuthEmulator, getAuth, initializeAuth } = FirebaseAuth

type ReactNativePersistenceModule = {
  getReactNativePersistence?: (
    storage: typeof AsyncStorage,
  ) => FirebaseAuth.Persistence
}

type GlobalAuthEmulatorState = {
  __heroAuthEmulatorAppNames?: Set<string>
}

const globalAuthEmulatorState = globalThis as typeof globalThis & GlobalAuthEmulatorState

const connectedAuthEmulatorAppNames =
  globalAuthEmulatorState.__heroAuthEmulatorAppNames ??
  (globalAuthEmulatorState.__heroAuthEmulatorAppNames = new Set<string>())

const DEFAULT_AUTH_EMULATOR_PORT = 9099

const isAuthAlreadyInitializedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  return 'code' in error && error.code === 'auth/already-initialized'
}

const resolveAuthEmulatorUrl = (): string => {
  const hostOverride = env.AUTH_EMULATOR_HOST?.trim()

  if (hostOverride) {
    if (hostOverride.startsWith('http://') || hostOverride.startsWith('https://')) {
      return hostOverride
    }

    if (hostOverride.includes(':')) {
      return `http://${hostOverride}`
    }

    return `http://${hostOverride}:${DEFAULT_AUTH_EMULATOR_PORT}`
  }

  const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
  return `http://${defaultHost}:${DEFAULT_AUTH_EMULATOR_PORT}`
}

const getNativePersistence = (): FirebaseAuth.Persistence => {
  let reactNativeAuth: ReactNativePersistenceModule

  try {
    reactNativeAuth = require('firebase/auth/react-native') as ReactNativePersistenceModule
  } catch {
    throw new Error(
      'firebase/auth/react-native is unavailable; set EXPO_PUBLIC_USE_EMULATOR=false or verify native Firebase auth setup.',
    )
  }

  if (typeof reactNativeAuth.getReactNativePersistence !== 'function') {
    throw new Error(
      'firebase/auth/react-native#getReactNativePersistence is unavailable; native auth persistence cannot be initialized.',
    )
  }

  return reactNativeAuth.getReactNativePersistence(AsyncStorage)
}

const createAuth = () => {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp)
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: getNativePersistence(),
    })
  } catch (error) {
    if (isAuthAlreadyInitializedError(error)) {
      return getAuth(firebaseApp)
    }

    throw error
  }
}

export const firebaseAuth = createAuth()

if (env.USE_EMULATOR) {
  const appName = firebaseAuth.app.name

  if (!connectedAuthEmulatorAppNames.has(appName)) {
    connectAuthEmulator(firebaseAuth, resolveAuthEmulatorUrl(), {
      disableWarnings: true,
    })

    connectedAuthEmulatorAppNames.add(appName)
  }
}

export default firebaseApp
