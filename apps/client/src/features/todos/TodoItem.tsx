import { Pencil, Trash2 } from 'lucide-react-native'
import { Pressable, ScrollView, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { Tag, Todo } from '@shared/types/api'
import { AppStack, AppTagBadge, AppText } from '@/ui/components'
import { tokens } from '@/ui/tokens'
import { cn } from '@/ui/utils/cn'

/** Format dueDate (ISO or YYYY-MM-DD) to YYYY-MM-DD for display */
function formatDueDate(value: string): string {
  const date = value.includes('T') ? value.slice(0, 10) : value
  return date
}

interface Props {
  todo: Todo
  tags?: Tag[]
  selectedTagId?: string | null
  onTagPress?: (tagId: string) => void
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
}

export function TodoItem({
  todo,
  tags,
  selectedTagId = null,
  onTagPress,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const dueLabel = todo.dueDate
    ? t('todos.dueDate', { date: formatDueDate(todo.dueDate) })
    : null

  return (
    <View
      testID={`todo-item-${todo.id}`}
      className="mb-2 flex-row items-center gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <Pressable
        testID={`todo-toggle-${todo.id}`}
        accessibilityRole="checkbox"
        accessibilityLabel={todo.title}
        accessibilityState={{ checked: todo.completed }}
        aria-checked={todo.completed}
        onPress={() => onToggle(todo.id)}
        className={cn(
          'h-11 w-11 items-center justify-center rounded-md border',
          todo.completed ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
        )}
      >
        {todo.completed ? (
          <AppText tone="default" weight="bold" size="md">
            ✓
          </AppText>
        ) : null}
      </Pressable>

      <AppStack gap={1} className="min-w-0 flex-1">
        <AppText
          weight="semibold"
          className={cn(todo.completed && 'line-through opacity-50')}
          numberOfLines={2}
        >
          {todo.title}
        </AppText>

        {todo.description ? (
          <AppText
            size="sm"
            tone="muted"
            numberOfLines={2}
            className={cn(todo.completed && 'opacity-70')}
          >
            {todo.description}
          </AppText>
        ) : null}

        {dueLabel ? (
          <AppText size="sm" tone="muted" className={cn(todo.completed && 'opacity-70')}>
            {dueLabel}
          </AppText>
        ) : null}

        {todo.tagIds?.length && tags?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
            className="-mx-0.5"
          >
            {todo.tagIds.map(tagId => {
              const tag = tags.find(t => t.id === tagId)
              if (!tag) return null
              return (
                <AppTagBadge
                  key={tagId}
                  name={tag.name}
                  emoji={tag.emoji}
                  colorToken={tag.colorToken}
                  active={selectedTagId === tag.id}
                  onPress={() => onTagPress?.(tag.id)}
                  testID={`todo-tag-${todo.id}-${tagId}`}
                />
              )
            })}
          </ScrollView>
        ) : null}
      </AppStack>

      <View className="flex-row items-center gap-2">
        <Pressable
          testID={`todo-edit-${todo.id}`}
          className="h-11 w-11 items-center justify-center"
          onPress={() => onEdit(todo)}
          accessibilityRole="button"
          accessibilityLabel={t('todos.edit')}
        >
          <Pencil size={20} color={tokens.colors.muted} />
        </Pressable>

        <Pressable
          testID={`todo-delete-${todo.id}`}
          className="h-11 w-11 items-center justify-center"
          onPress={() => onDelete(todo)}
          accessibilityRole="button"
          accessibilityLabel={t('todos.delete')}
        >
          <Trash2 size={20} color={tokens.colors.danger} />
        </Pressable>
      </View>
    </View>
  )
}
