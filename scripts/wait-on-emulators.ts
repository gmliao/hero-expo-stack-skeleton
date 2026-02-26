import { waitOn } from 'wait-on'

async function main() {
  console.log('⏳ Waiting for emulators...')
  await waitOn({
    resources: [
      'http://127.0.0.1:9099',   // Auth
      'http://127.0.0.1:8080',   // Firestore
      'http://127.0.0.1:5001',   // Functions
    ],
    timeout: 60000,
  })
  console.log('✅ Emulators ready')
}

main().catch(e => { console.error(e); process.exit(1) })
