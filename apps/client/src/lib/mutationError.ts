import { Alert } from 'react-native'

/**
 * Global mutation onError handler for TanStack Query.
 * Surfaces any mutation failure as a native Alert dialog.
 */
export function handleMutationError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown error'
  Alert.alert('Error', message)
}
