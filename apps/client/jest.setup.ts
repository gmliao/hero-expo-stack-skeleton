import 'react-native-gesture-handler/jestSetup'
import '@testing-library/jest-native/extend-expect'

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-uid',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
  firebaseAuth: {
    currentUser: {
      uid: 'test-uid',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/lib/env', () => ({
  env: {
    FUNCTIONS_URL: 'http://localhost:5001',
  },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSegments: () => [],
  Redirect: () => null,
  Stack: () => null,
}))
