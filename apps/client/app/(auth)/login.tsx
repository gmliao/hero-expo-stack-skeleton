import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'
import { LoginForm, type LoginSubmitResult } from '@/features/auth/LoginForm'

export default function LoginScreen() {
  const { t } = useTranslation()
  const setUid = useAuthStore(s => s.setUid)

  const handleSubmit = useCallback<(
    email: string,
    password: string,
  ) => Promise<LoginSubmitResult>>(
    async (email, password) => {
      try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
        setUid(cred.user.uid)
        router.replace('/(app)')
      } catch (err) {
        const code = (err as { code?: string }).code
        if (code === 'auth/network-request-failed') {
          return { error: t('auth.networkError') }
        }
        return { error: t('auth.invalidCredentials') }
      }
    },
    [setUid, t],
  )

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <LoginForm onSubmit={handleSubmit} />
    </SafeAreaView>
  )
}
