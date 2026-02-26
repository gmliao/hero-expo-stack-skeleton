import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input, Spinner, Text, YStack } from 'tamagui'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'

const MIN_PASSWORD_LENGTH = 6

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
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <YStack
        flex={1}
        justifyContent="center"
        padding="$6"
        backgroundColor="$background"
        gap="$4"
        width="100%"
        maxWidth={420}
        alignSelf="center"
      >
        <Text fontSize="$7" fontWeight="700" color="$color">
          {t('auth.signUpTitle')}
        </Text>

        {error && (
          <Text color="$danger" testID="sign-up-error" accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        <YStack gap="$1">
          <Text fontSize="$3" color="$colorSecondary">
            {t('auth.email')}
          </Text>
          <Input
            testID="sign-up-email-input"
            accessibilityLabel={t('auth.email')}
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            size="$5"
          />
        </YStack>

        <YStack gap="$1">
          <Text fontSize="$3" color="$colorSecondary">
            {t('auth.password')}
          </Text>
          <Input
            testID="sign-up-password-input"
            accessibilityLabel={t('auth.password')}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            size="$5"
          />
        </YStack>

        <YStack gap="$1">
          <Text fontSize="$3" color="$colorSecondary">
            {t('auth.confirmPassword')}
          </Text>
          <Input
            testID="sign-up-confirm-input"
            accessibilityLabel={t('auth.confirmPassword')}
            placeholder={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            size="$5"
          />
        </YStack>

        <Button
          testID="sign-up-button"
          onPress={handleSignUp}
          backgroundColor="$primary"
          color="$white"
          disabled={loading}
          icon={loading ? <Spinner color="$white" /> : undefined}
          size="$5"
          marginTop="$2"
        >
          {loading ? t('auth.signingUp') : t('auth.signUp')}
        </Button>

        <Pressable
          onPress={() => router.push('/(auth)/login')}
          style={{ paddingVertical: 12, alignSelf: 'center' }}
          testID="sign-up-link-login"
          accessibilityRole="link"
          accessibilityLabel={t('auth.goToSignIn')}
        >
          <Text fontSize="$3" color="$colorSecondary">
            {t('auth.goToSignIn')}
          </Text>
        </Pressable>
      </YStack>
    </SafeAreaView>
  )
}
