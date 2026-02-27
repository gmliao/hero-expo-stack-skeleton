// Set env before loading firebase-admin so GCE metadata lookup is skipped (prevents MetadataLookupWarning)
process.env.METADATA_SERVER_DETECTION = 'none'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

const { default: admin } = await import('firebase-admin')

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'hero-stack-local'
const app = admin.initializeApp({ projectId })
const auth = admin.auth()
const db = admin.firestore()

const users: { uid: string; email: string; password: string; displayName: string }[] = [
  { uid: 'user-1', email: 'test1@example.com', password: 'password', displayName: 'Test User 1' },
  { uid: 'user-2', email: 'test2@example.com', password: 'password', displayName: 'Test User 2' },
]

const todos = [
  { uid: 'user-1', title: 'Buy groceries', description: 'Milk, eggs, bread', completed: false },
  { uid: 'user-1', title: 'Finish skeleton', description: 'Deploy Firebase functions', completed: true },
  { uid: 'user-2', title: 'Learn TanStack Query', completed: false },
]

async function seed() {
  console.log('🌱 Seeding emulator...')
  for (const u of users) {
    try {
      await auth.createUser({
        uid: u.uid,
        email: u.email,
        password: u.password,
        emailVerified: true,
        displayName: u.displayName,
      })
      console.log(`  ✓ user ${u.email}`)
    } catch (e: any) {
      if (e.code !== 'auth/uid-already-exists') throw e
      console.log(`  · user ${u.email} already exists`)
    }
  }
  for (const t of todos) {
    await db.collection('todos').add({
      ...t,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    })
    console.log(`  ✓ todo "${t.title}" for ${t.uid}`)
  }
  console.log('✅ Seed complete')
}

seed().catch(e => { console.error(e); process.exit(1) }).finally(() => app.delete())

export {}
