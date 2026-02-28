import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'

import { AppButton, AppText } from '@/ui/components'

type TodosScreenHeaderProps = {
  onCreatePress: () => void
}

export function TodosScreenHeader({ onCreatePress }: TodosScreenHeaderProps) {
  const { t } = useTranslation()
  return (
    <View className="flex-row items-center justify-between border-b border-border bg-bg px-5 py-3">
      <AppText testID="todos-title" size="xl" weight="bold">
        {t('todos.title')}
      </AppText>
      <View className="flex-row items-center gap-2">
        <AppButton
          testID="create-todo-button"
          size="sm"
          onPress={onCreatePress}
        >
          {t('todos.create')}
        </AppButton>
        <Pressable
          onPress={() => router.push('/(app)/options')}
          className="py-2 px-3"
          testID="todos-options-link"
          accessibilityRole="button"
          accessibilityLabel={t('options.title')}
        >
          <AppText size="sm" tone="muted">
            {t('options.title')}
          </AppText>
        </Pressable>
      </View>
    </View>
  )
}
