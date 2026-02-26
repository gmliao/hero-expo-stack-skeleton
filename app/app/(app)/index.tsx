import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui'

import { useTodosQuery } from '@/data/hooks/useTodosQuery'
import { useToggleTodoMutation } from '@/data/hooks/useToggleTodoMutation'
import { CreateTodoModal } from '@/features/todos/CreateTodoModal'
import { TodoItem } from '@/features/todos/TodoItem'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

export default function TodosScreen() {
  const { t } = useTranslation()
  const uid = useAuthStore(s => s.uid) ?? ''
  const { data: todos, isPending, isError } = useTodosQuery(uid)
  const toggleMutation = useToggleTodoMutation()
  const openModal = useUIStore(s => s.openCreateModal)

  if (isPending) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$primary" />
        </YStack>
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
          <Text color="$danger" textAlign="center">
            {t('todos.loadError')}
          </Text>
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <YStack flex={1} backgroundColor="$background">
        <XStack
          padding="$4"
          justifyContent="space-between"
          alignItems="center"
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          <Text
            testID="todos-title"
            fontSize="$6"
            fontWeight="700"
            color="$color"
          >
            {t('todos.title')}
          </Text>
          <Button
            testID="create-todo-button"
            onPress={openModal}
            backgroundColor="$primary"
            color="$white"
            size="$3"
          >
            {t('todos.create')}
          </Button>
        </XStack>

        <ScrollView flex={1}>
          {todos?.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={id => toggleMutation.mutate(id)}
            />
          ))}
          {todos?.length === 0 && (
            <Text
              testID="todos-empty"
              padding="$6"
              color="$colorSecondary"
              textAlign="center"
              fontSize="$4"
            >
              {t('todos.empty')}
            </Text>
          )}
        </ScrollView>

        <CreateTodoModal />
      </YStack>
    </SafeAreaView>
  )
}
