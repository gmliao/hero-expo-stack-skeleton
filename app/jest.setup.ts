import '@testing-library/jest-native/extend-expect'

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-uid',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
  })),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
  firebaseAuth: {
    currentUser: {
      uid: 'test-uid',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
  },
}))

jest.mock('@/lib/env', () => ({
  env: {
    FUNCTIONS_URL: 'http://localhost:5001',
  },
}))
