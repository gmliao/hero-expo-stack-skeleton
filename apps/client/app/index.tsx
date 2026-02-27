import { Redirect } from 'expo-router'

/**
 * Root "/" → (app) (todos). Unauthenticated users are redirected to login by _layout.tsx.
 */
export default function Index() {
  return <Redirect href="/(app)" />
}
