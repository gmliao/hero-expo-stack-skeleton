import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'
import { AppButton, AppInput, AppStack, AppText } from '@/ui/components'

const MIN_PASSWORD_LENGTH = 6

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  formWrap: { width: '100%', maxWidth: 420 },
})

export default function SignUpScreen() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setUid = useAuthStore(s => s.setUid)

  async function handleSignUp() {
    setError(null)
    if (!email.trim()) return
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.weakPassword'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password)
      setUid(cred.user.uid)
      router.replace('/(app)')
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setError(t('auth.emailAlreadyInUse'))
      } else if (code === 'auth/weak-password') {
        setError(t('auth.weakPassword'))
      } else if (code === 'auth/network-request-failed') {
        setError(t('auth.networkError'))
      } else {
        setError(t('auth.invalidCredentials'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View className="flex-1 items-center bg-bg px-5 py-7">
        <AppStack gap={5} className="flex-1 w-full justify-center" style={styles.formWrap}>
          <AppText size="xl" weight="bold">
            {t('auth.signUpTitle')}
          </AppText>

          {error ? (
            <AppText tone="danger" testID="sign-up-error" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}

          <AppStack gap={1}>
            <AppText size="sm" tone="muted">
              {t('auth.email')}
            </AppText>
            <AppInput
              testID="sign-up-email-input"
              accessibilityLabel={t('auth.email')}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              size="md"
            />
          </AppStack>

          <AppStack gap={1}>
            <AppText size="sm" tone="muted">
              {t('auth.password')}
            </AppText>
            <AppInput
              testID="sign-up-password-input"
              accessibilityLabel={t('auth.password')}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              size="md"
            />
          </AppStack>

          <AppStack gap={1}>
            <AppText size="sm" tone="muted">
              {t('auth.confirmPassword')}
            </AppText>
            <AppInput
              testID="sign-up-confirm-input"
              accessibilityLabel={t('auth.confirmPassword')}
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              size="md"
            />
          </AppStack>

          <AppButton
            testID="sign-up-button"
            onPress={handleSignUp}
            disabled={loading}
            isLoading={loading}
            size="lg"
          >
            {loading ? t('auth.signingUp') : t('auth.signUp')}
          </AppButton>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="self-center py-3"
            testID="sign-up-link-login"
            accessibilityRole="link"
            accessibilityLabel={t('auth.goToSignIn')}
          >
            <AppText size="sm" tone="muted">
              {t('auth.goToSignIn')}
            </AppText>
          </Pressable>
        </AppStack>
      </View>
    </SafeAreaView>
  )
}
