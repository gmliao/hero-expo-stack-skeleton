import { Checkbox, Text, XStack } from 'tamagui'

import type { Todo } from '@shared/types/api'

interface Props {
  todo: Todo
  onToggle: (id: string) => void
}

export function TodoItem({ todo, onToggle }: Props) {
  return (
    <XStack
      testID={`todo-item-${todo.id}`}
      padding="$4"
      borderBottomWidth={1}
      borderColor="$borderColor"
      alignItems="center"
      gap="$3"
      pressStyle={{ backgroundColor: '$backgroundPress' }}
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
      <Text
        flex={1}
        color="$color"
        fontSize="$4"
        lineHeight="$4"
        textDecorationLine={todo.completed ? 'line-through' : 'none'}
        opacity={todo.completed ? 0.5 : 1}
      >
        {todo.title}
      </Text>
    </XStack>
  )
}
