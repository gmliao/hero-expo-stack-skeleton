if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
}

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
}

export const PROJECT_ID = 'hero-stack-local'
export const FUNCTIONS_PORT = process.env.FUNCTIONS_EMULATOR_PORT ?? '5001'
export const BASE_URL = `http://127.0.0.1:${FUNCTIONS_PORT}/${PROJECT_ID}/us-central1/api`
export const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST!

