import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import axios from 'axios'

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

// Must run with emulators active (firebase emulators:exec)
const PROJECT_ID = 'hero-stack-local'
const BASE_URL = `http://127.0.0.1:5001/${PROJECT_ID}/us-central1/api`

async function getIdTokenForUid(uid: string): Promise<string> {
  const customToken = await getAuth().createCustomToken(uid)
  const response = await axios.post(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo-key',
    { token: customToken, returnSecureToken: true },
  )
  return response.data.idToken as string
}

if (!getApps().length) {
  initializeApp({ projectId: 'hero-stack-local' })
}

describe('Auth Middleware', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await axios.get(`${BASE_URL}/health`, {
      validateStatus: () => true,
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const res = await axios.get(`${BASE_URL}/health`, {
      headers: { Authorization: 'Bearer invalid-token' },
      validateStatus: () => true,
    })
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid emulator ID token', async () => {
    const uid = `test-auth-${Date.now()}`
    await getAuth().createUser({ uid, email: `${uid}@example.com` })
    const token = await getIdTokenForUid(uid)

    const res = await axios.get(`${BASE_URL}/health`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    })

    await getAuth().deleteUser(uid)
    expect(res.status).toBe(200)
  })
})
