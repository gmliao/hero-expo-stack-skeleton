import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'
import { SignUpForm, type SignUpSubmitResult } from '@/features/auth/SignUpForm'

export default function SignUpScreen() {
  const { t } = useTranslation()
  const setUid = useAuthStore(s => s.setUid)

  const handleSubmit = useCallback<(
    email: string,
    password: string,
  ) => Promise<SignUpSubmitResult>>(
    async (email, password) => {
      try {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
        setUid(cred.user.uid)
        router.replace('/(app)')
      } catch (err) {
        const code = (err as { code?: string }).code
        if (code === 'auth/email-already-in-use') {
          return { error: t('auth.emailAlreadyInUse') }
        }
        if (code === 'auth/weak-password') {
          return { error: t('auth.weakPassword') }
        }
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
      <SignUpForm onSubmit={handleSubmit} />
    </SafeAreaView>
  )
}
