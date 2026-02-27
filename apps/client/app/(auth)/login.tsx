import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input, Spinner, Text, YStack } from 'tamagui'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'

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
    } catch (error) {
      const code = (error as { code?: string }).code
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
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <YStack
        flex={1}
        justifyContent="center"
        paddingVertical="$8"
        paddingHorizontal="$5"
        backgroundColor="$background"
        gap="$6"
        width="100%"
        maxWidth={420}
        alignSelf="center"
      >
        <Text fontSize={28} fontWeight="700" color="$color">
          {t('auth.signInTitle')}
        </Text>

        {error && (
          <Text color="$danger" testID="login-error" accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        <YStack gap="$1">
          <Text fontSize={14} color="$colorSecondary">
            {t('auth.email')}
          </Text>
          <Input
            testID="email-input"
            accessibilityLabel={t('auth.email')}
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            size="$5"
            fontSize={16}
            borderRadius="$4"
            borderColor="$borderColor"
          />
        </YStack>

        <YStack gap="$1">
          <Text fontSize={14} color="$colorSecondary">
            {t('auth.password')}
          </Text>
          <Input
            testID="password-input"
            accessibilityLabel={t('auth.password')}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            size="$5"
            fontSize={16}
            borderRadius="$4"
            borderColor="$borderColor"
          />
        </YStack>

        <Button
          testID="login-button"
          onPress={handleLogin}
          backgroundColor="$primary"
          color="$white"
          disabled={loading}
          icon={loading ? <Spinner color="$white" /> : undefined}
          size="$5"
          marginTop="$2"
          borderRadius="$6"
          height={52}
          justifyContent="center"
          alignItems="center"
          fontSize={17}
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </Button>

        <Pressable
          onPress={() => router.push('/(auth)/sign-up')}
          style={{ paddingVertical: 12, alignSelf: 'center' }}
          testID="login-link-sign-up"
          accessibilityRole="link"
          accessibilityLabel={t('auth.goToSignUp')}
        >
          <Text fontSize={14} color="$colorSecondary">
            {t('auth.goToSignUp')}
          </Text>
        </Pressable>
      </YStack>
    </SafeAreaView>
  )
}
