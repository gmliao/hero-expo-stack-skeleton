import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'
import { AppButton, AppScreenContainer, AppStack, AppText } from '@/ui/components'

export default function OptionsScreen() {
  const { t } = useTranslation()
  const setUid = useAuthStore(s => s.setUid)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    setLogoutError(null)
    try {
      await firebaseAuth.signOut()
      setUid(null)
      router.replace('/(auth)/login')
    } catch {
      setLogoutError(t('options.logoutFailed'))
    }
  }

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <View className="flex-1 bg-bg">
        <AppScreenContainer className="flex-1">
          <AppStack gap={6} className="flex-1 px-5 py-8">
            <Pressable
              onPress={() => router.back()}
              testID="options-back"
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <AppText size="md" tone="muted">
                ← {t('common.back')}
              </AppText>
            </Pressable>
            <AppText testID="options-title" size="xl" weight="bold">
              {t('options.title')}
            </AppText>
            <Pressable
              onPress={() => router.push('/(app)/manage-tags')}
              testID="options-manage-tags"
              accessibilityRole="button"
              accessibilityLabel={t('options.manageTags')}
            >
              <AppText size="md" tone="muted">
                {t('options.manageTags')}
              </AppText>
            </Pressable>
            <AppButton
              testID="options-logout"
              variant="primary"
              onPress={handleLogout}
              accessibilityLabel={t('options.logout')}
            >
              {t('options.logout')}
            </AppButton>
            {logoutError ? (
              <AppText
                tone="danger"
                accessibilityLiveRegion="polite"
                testID="options-logout-error"
              >
                {logoutError}
              </AppText>
            ) : null}
          </AppStack>
        </AppScreenContainer>
      </View>
    </SafeAreaView>
  )
}
