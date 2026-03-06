import { useRef, useState } from 'react'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput } from 'react-native'
import {
  AppButton,
  AppInput,
  AppLinkAction,
  AppStack,
  AppText,
  FormScreenContainer,
} from '@/ui/components'

export type LoginSubmitResult = { error?: string } | void

type LoginFormProps = {
  onSubmit: (email: string, password: string) => Promise<LoginSubmitResult>
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const passwordRef = useRef<TextInput>(null)

  async function handleSubmit() {
    Keyboard.dismiss()
    if (!email.trim() || !password) {
      setError(t('auth.fieldsRequired'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await onSubmit(email.trim(), password)
      if (result?.error) setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormScreenContainer>
      <AppStack gap={6} className="flex-1 w-full max-w-[420px] justify-center">
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
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
            size="md"
          />
        </AppStack>

        <AppStack gap={1}>
          <AppText size="sm" tone="muted">
            {t('auth.password')}
          </AppText>
          <AppInput
            ref={passwordRef}
            testID="password-input"
            accessibilityLabel={t('auth.password')}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={() => {
              void handleSubmit()
            }}
            size="md"
          />
        </AppStack>

        <AppButton
          testID="login-button"
          onPress={handleSubmit}
          disabled={loading}
          isLoading={loading}
          size="lg"
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </AppButton>

        <AppLinkAction
          testID="login-link-sign-up"
          onPress={() => router.push('/(auth)/sign-up')}
          accessibilityLabel={t('auth.goToSignUp')}
        >
          {t('auth.goToSignUp')}
        </AppLinkAction>
      </AppStack>
    </FormScreenContainer>
  )
}
