import { useState } from 'react'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { AppButton, AppInput, AppStack, AppText } from '@/ui/components'

const MIN_PASSWORD_LENGTH = 6

export type SignUpSubmitResult = { error?: string } | void

type SignUpFormProps = {
  onSubmit: (email: string, password: string) => Promise<SignUpSubmitResult>
}

export function SignUpForm({ onSubmit }: SignUpFormProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
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
      const result = await onSubmit(email.trim(), password)
      if (result?.error) setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 items-center bg-bg px-5 py-7">
      <AppStack gap={5} className="flex-1 w-full max-w-[420px] justify-center">
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
          onPress={handleSubmit}
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
  )
}
