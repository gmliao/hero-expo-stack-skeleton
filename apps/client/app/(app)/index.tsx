import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui'

import type { Todo } from '@shared/types/api'
import { useDeleteTodoMutation } from '@/data/hooks/useDeleteTodoMutation'
import { useTodosQuery } from '@/data/hooks/useTodosQuery'
import { useToggleTodoMutation } from '@/data/hooks/useToggleTodoMutation'
import { CreateTodoModal } from '@/features/todos/CreateTodoModal'
import { FilterTabs } from '@/features/todos/FilterTabs'
import { TodoItem } from '@/features/todos/TodoItem'
import { useBreakpoint } from '@/lib/useBreakpoint'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

const CONTENT_MAX_WIDTH = 720

export default function TodosScreen() {
  const { t } = useTranslation()
  const breakpoint = useBreakpoint()
  const uid = useAuthStore(s => s.uid) ?? ''
  const filter = useUIStore(s => s.filter)
  const setFilter = useUIStore(s => s.setFilter)
  const { data: todos, isPending, isError } = useTodosQuery(uid, filter)
  const toggleMutation = useToggleTodoMutation()
  const deleteMutation = useDeleteTodoMutation()
  const openModal = useUIStore(s => s.openCreateModal)
  const setSelectedTodoId = useUIStore(s => s.setSelectedTodoId)
  const showBanner = useUIStore(s => s.showBanner)

  const handleToggle = useCallback(
    (id: string) => {
      toggleMutation.mutate(id)
    },
    [toggleMutation],
  )

  const handleEdit = useCallback(
    (todo: Todo) => {
      setSelectedTodoId(todo.id)
      openModal()
    },
    [setSelectedTodoId, openModal],
  )

  const handleDelete = useCallback(
    (todo: Todo) => {
      Alert.alert(
        t('todos.deleteConfirmTitle'),
        t('todos.deleteConfirmMessage'),
        [
          { text: t('todos.deleteConfirmCancel'), style: 'cancel' },
          {
            text: t('todos.deleteConfirmDelete'),
            style: 'destructive',
            onPress: () =>
              deleteMutation.mutate(todo.id, {
                onError: () => showBanner(t('todos.deleteError')),
              }),
          },
        ],
      )
    },
    [t, deleteMutation, showBanner],
  )

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <CreateTodoModal />

      {isPending && (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$primary" />
        </YStack>
      )}

      {isError && (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
          <Text color="$danger" textAlign="center">
            {t('todos.loadError')}
          </Text>
        </YStack>
      )}

      {!isPending && !isError && (
        <YStack
          flex={1}
          backgroundColor="$background"
          width="100%"
          maxWidth={breakpoint === 'desktop' ? CONTENT_MAX_WIDTH : undefined}
          alignSelf="center"
          padding={0}
          minHeight={0}
        >
          <XStack
            flexShrink={0}
            paddingVertical="$3"
            paddingHorizontal="$5"
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth={1}
            borderColor="$borderColor"
            backgroundColor="$background"
          >
            <Text
              testID="todos-title"
              fontSize={22}
              fontWeight="700"
              color="$color"
            >
              {t('todos.title')}
            </Text>
            <Button
              testID="create-todo-button"
              onPress={() => {
                setSelectedTodoId(null)
                openModal()
              }}
              backgroundColor="$cta"
              color="$white"
              size="$3"
              borderRadius="$4"
              height={40}
              justifyContent="center"
              alignItems="center"
              fontSize={15}
            >
              {t('todos.create')}
            </Button>
          </XStack>

          <FilterTabs value={filter} onChange={setFilter} />

          <ScrollView
            flex={1}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 32 }}
          >
            {todos?.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            {todos?.length === 0 && (
              <YStack
                flex={1}
                padding="$6"
                justifyContent="center"
                alignItems="center"
                gap="$4"
              >
                <Text
                  testID="todos-empty"
                  color="$colorSecondary"
                  textAlign="center"
                  fontSize={16}
                >
                  {t('todos.empty')}
                </Text>
                <Button
                  testID="create-todo-button-empty"
                  onPress={() => {
                    setSelectedTodoId(null)
                    openModal()
                  }}
                  backgroundColor="$cta"
                  color="$white"
                  size="$4"
                  borderRadius="$4"
                  justifyContent="center"
                  alignItems="center"
                  fontSize={16}
                >
                  {t('todos.create')}
                </Button>
              </YStack>
            )}
          </ScrollView>
        </YStack>
      )}
    </SafeAreaView>
  )
}
