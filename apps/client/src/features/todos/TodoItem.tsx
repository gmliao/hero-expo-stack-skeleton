import { Pencil, Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'tamagui'
import { Checkbox, Text, XStack, YStack } from 'tamagui'

import type { Todo } from '@shared/types/api'

const TOUCH_TARGET_MIN = 44

/** Format dueDate (ISO or YYYY-MM-DD) to YYYY-MM-DD for display */
function formatDueDate(value: string): string {
  const date = value.includes('T') ? value.slice(0, 10) : value
  return date
}

interface Props {
  todo: Todo
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dueLabel = todo.dueDate
    ? t('todos.dueDate', { date: formatDueDate(todo.dueDate) })
    : null

  return (
    <XStack
      testID={`todo-item-${todo.id}`}
      backgroundColor="$white"
      borderRadius="$6"
      borderWidth={1}
      borderColor="$borderColor"
      padding="$4"
      marginVertical="$2"
      marginHorizontal={0}
      alignItems="center"
      gap="$3"
    >
      <Checkbox
        testID={`todo-toggle-${todo.id}`}
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        size="$5"
        accessibilityLabel={todo.title}
      >
        <Checkbox.Indicator>
          <Text color="$primary" fontSize="$3" fontWeight="700">
            ✓
          </Text>
        </Checkbox.Indicator>
      </Checkbox>

      <YStack flex={1} gap="$1" minWidth={0}>
        <Text
          color="$color"
          fontSize={16}
          fontWeight="600"
          lineHeight={22}
          textDecorationLine={todo.completed ? 'line-through' : 'none'}
          opacity={todo.completed ? 0.5 : 1}
        >
          {todo.title}
        </Text>
        {todo.description ? (
          <Text
            color="$colorSecondary"
            fontSize={12}
            lineHeight={16}
            numberOfLines={2}
            opacity={todo.completed ? 0.7 : 1}
          >
            {todo.description}
          </Text>
        ) : null}
        {dueLabel ? (
          <Text
            color="$colorSecondary"
            fontSize={12}
            lineHeight={16}
            opacity={todo.completed ? 0.7 : 1}
          >
            {dueLabel}
          </Text>
        ) : null}
      </YStack>

      <XStack gap="$2" alignItems="center">
        <XStack
          testID={`todo-edit-${todo.id}`}
          minWidth={TOUCH_TARGET_MIN}
          minHeight={TOUCH_TARGET_MIN}
          alignItems="center"
          justifyContent="center"
          onPress={() => onEdit(todo)}
          pressStyle={{ opacity: 0.8 }}
          accessibilityRole="button"
          accessibilityLabel={t('todos.edit')}
        >
          <Pencil size={20} color={theme.colorSecondary?.val ?? '#0F766E'} />
        </XStack>
        <XStack
          testID={`todo-delete-${todo.id}`}
          minWidth={TOUCH_TARGET_MIN}
          minHeight={TOUCH_TARGET_MIN}
          alignItems="center"
          justifyContent="center"
          onPress={() => onDelete(todo)}
          pressStyle={{ opacity: 0.8 }}
          accessibilityRole="button"
          accessibilityLabel={t('todos.delete')}
        >
          <Trash2 size={20} color={theme.danger?.val ?? '#ef4444'} />
        </XStack>
      </XStack>
    </XStack>
  )
}
