import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'
import { AppButton, AppScreenContainer, AppStack, AppText } from '@/ui/components'

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  /** Pen contentWrap: padding [32,20], gap 24 — no header border */
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
})

export default function OptionsScreen() {
  const { t } = useTranslation()
  const setUid = useAuthStore(s => s.setUid)

  async function handleLogout() {
    try {
      await firebaseAuth.signOut()
      setUid(null)
      router.replace('/(auth)/login')
    } catch {
      setUid(null)
      router.replace('/(auth)/login')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View className="flex-1 bg-bg">
        <AppScreenContainer className="flex-1">
          <AppStack gap={6} style={styles.contentWrap}>
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
            <AppButton
              testID="options-logout"
              variant="primary"
              onPress={handleLogout}
              accessibilityLabel={t('options.logout')}
            >
              {t('options.logout')}
            </AppButton>
          </AppStack>
        </AppScreenContainer>
      </View>
    </SafeAreaView>
  )
}
