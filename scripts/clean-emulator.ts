import * as admin from 'firebase-admin'

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

const app = admin.initializeApp({ projectId: 'hero-stack-local' })

async function clean() {
  console.log('🧹 Cleaning emulator data...')
  const collections = await admin.firestore().listCollections()
  for (const col of collections) {
    const snap = await col.get()
    const batch = admin.firestore().batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    console.log(`  ✓ cleared ${col.id}`)
  }
  console.log('✅ Clean complete')
}

clean().catch(e => { console.error(e); process.exit(1) }).finally(() => app.delete())
