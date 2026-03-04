import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const designTokens = require('@/ui/theme/design-tokens.js')

import type { Tag, Todo } from '@shared/types/api'
import { AppButton, AppStack, AppText } from '@/ui/components'
import { TodoItem } from './TodoItem'

type TodosListProps = {
  todos: Todo[] | undefined
  tags?: Tag[]
  selectedTagId?: string | null
  onTagPress?: (tagId: string) => void
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
  onCreatePress: () => void
}

/**
 * ScrollView content container uses StyleSheet because NativeWind's
 * contentContainerClassName has unstable layout support.
 * Spacing values are sourced from design-tokens to stay within the token system.
 */
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: designTokens.spacing[5], // 20px
    paddingTop: designTokens.spacing[5],         // 20px
    paddingBottom: designTokens.spacing[8],      // 32px
  },
})

export function TodosList({
  todos,
  tags = [],
  selectedTagId = null,
  onTagPress,
  onToggle,
  onEdit,
  onDelete,
  onCreatePress,
}: TodosListProps) {
  const { t } = useTranslation()
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={styles.scrollContent}
    >
      {todos?.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          tags={tags}
          selectedTagId={selectedTagId}
          onTagPress={onTagPress}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {todos?.length === 0 ? (
        <AppStack gap={4} className="flex-1 items-center justify-center p-6">
          <AppText testID="todos-empty" tone="muted" className="text-center">
            {t('todos.empty')}
          </AppText>
          <AppButton
            testID="create-todo-button-empty"
            onPress={onCreatePress}
          >
            {t('todos.create')}
          </AppButton>
        </AppStack>
      ) : null}
    </ScrollView>
  )
}
