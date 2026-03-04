import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import axios from 'axios'
import type { ApiResponseDto, Tag } from '../../../../../shared/types/api'
import { AUTH_HOST, BASE_URL, PROJECT_ID } from './testEnv'

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID })
}

const auth = getAuth()
const db = getFirestore()

function unwrapSuccess<T>(body: ApiResponseDto<T>): T {
  if (!body || typeof body !== 'object' || body.success !== true) {
    throw new Error('Expected success response')
  }
  return body.data
}

async function getIdTokenForUid(uid: string): Promise<string> {
  const customToken = await auth.createCustomToken(uid)
  const response = await axios.post(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo-key`,
    { token: customToken, returnSecureToken: true },
  )
  return response.data.idToken as string
}

describe('Tags API integration', () => {
  const uid = `test-tags-${Date.now()}`
  let idToken: string

  beforeAll(async () => {
    await auth.createUser({ uid, email: `${uid}@example.com` })
    idToken = await getIdTokenForUid(uid)
  })

  afterAll(async () => {
    const snap = await db.collection('users').doc(uid).collection('tags').get()
    const batch = db.batch()
    snap.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    await auth.deleteUser(uid)
  })

  it('POST /tags creates emoji + colorToken and GET /tags returns them', async () => {
    const createRes = await axios.post<ApiResponseDto<Tag>>(
      `${BASE_URL}/tags`,
      { name: 'Work', emoji: '🧰', colorToken: 'tagTeal' },
      { headers: { Authorization: `Bearer ${idToken}` } },
    )

    expect(createRes.status).toBe(201)
    const created = unwrapSuccess(createRes.data)
    expect(created).toMatchObject({
      name: 'Work',
      emoji: '🧰',
      colorToken: 'tagTeal',
      uid,
    })

    const listRes = await axios.get<ApiResponseDto<Tag[]>>(`${BASE_URL}/tags`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })

    expect(listRes.status).toBe(200)
    expect(unwrapSuccess(listRes.data)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          name: 'Work',
          emoji: '🧰',
          colorToken: 'tagTeal',
        }),
      ]),
    )
  })

  it('PATCH /tags/:tagId updates emoji + colorToken and GET /tags returns the edited values', async () => {
    const createRes = await axios.post<ApiResponseDto<Tag>>(
      `${BASE_URL}/tags`,
      { name: 'Source', emoji: '🧰', colorToken: 'tagTeal' },
      { headers: { Authorization: `Bearer ${idToken}` } },
    )
    const created = unwrapSuccess(createRes.data)

    const updateRes = await axios.patch<ApiResponseDto<Tag>>(
      `${BASE_URL}/tags/${created.id}`,
      { name: 'Edited', emoji: '📚', colorToken: 'tagRose' },
      { headers: { Authorization: `Bearer ${idToken}` } },
    )

    expect(updateRes.status).toBe(200)
    expect(unwrapSuccess(updateRes.data)).toMatchObject({
      id: created.id,
      name: 'Edited',
      emoji: '📚',
      colorToken: 'tagRose',
    })

    const listRes = await axios.get<ApiResponseDto<Tag[]>>(`${BASE_URL}/tags`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })

    expect(listRes.status).toBe(200)
    expect(unwrapSuccess(listRes.data)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          name: 'Edited',
          emoji: '📚',
          colorToken: 'tagRose',
        }),
      ]),
    )
  })
})
