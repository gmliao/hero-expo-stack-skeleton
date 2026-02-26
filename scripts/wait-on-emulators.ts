import { waitOn } from 'wait-on'

const WAIT_EXPO = process.env.WAIT_EXPO_WEB === 'true'

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

  if (WAIT_EXPO) {
    console.log('⏳ Waiting for Expo web server...')
    await waitOn({
      resources: ['http://127.0.0.1:8081'],
      timeout: 120000,
    })
    console.log('✅ Expo web server ready')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
