import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, Text, YStack } from 'tamagui'

export default function HomeRoute() {
  const { t } = useTranslation()

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" padding="$4">
        <Text fontSize="$7" fontWeight="700" color="$primary" testID="home-title">
          {t('todos.title')}
        </Text>
        <Text color="$colorSecondary" testID="home-subtitle">
          {t('todos.empty')}
        </Text>
      </YStack>
      <Stack height={1} backgroundColor="$borderColor" />
    </SafeAreaView>
  )
}
