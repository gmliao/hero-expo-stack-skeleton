import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'
import { AppButton, AppInput, AppStack, AppText } from '@/ui/components'

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  formWrap: { width: '100%', maxWidth: 420 },
})

export default function LoginScreen() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setUid = useAuthStore(s => s.setUid)

  async function handleLogin() {
    if (!email.trim() || !password) return
    setLoading(true)
    setError(null)
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
      setUid(cred.user.uid)
      router.replace('/(app)')
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'auth/network-request-failed') {
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
      <View className="flex-1 items-center bg-bg px-5 py-8">
        <AppStack gap={6} className="flex-1 w-full justify-center" style={styles.formWrap}>
          <AppText size="xl" weight="bold">
            {t('auth.signInTitle')}
          </AppText>

          {error ? (
            <AppText tone="danger" testID="login-error" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}

          <AppStack gap={1}>
            <AppText size="sm" tone="muted">
              {t('auth.email')}
            </AppText>
            <AppInput
              testID="email-input"
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
              testID="password-input"
              accessibilityLabel={t('auth.password')}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              size="md"
            />
          </AppStack>

          <AppButton
            testID="login-button"
            onPress={handleLogin}
            disabled={loading}
            isLoading={loading}
            size="lg"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </AppButton>

          <Pressable
            onPress={() => router.push('/(auth)/sign-up')}
            className="self-center py-3"
            testID="login-link-sign-up"
            accessibilityRole="link"
            accessibilityLabel={t('auth.goToSignUp')}
          >
            <AppText size="sm" tone="muted">
              {t('auth.goToSignUp')}
            </AppText>
          </Pressable>
        </AppStack>
      </View>
    </SafeAreaView>
  )
}
