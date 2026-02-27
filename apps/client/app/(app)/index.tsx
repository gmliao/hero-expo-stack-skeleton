import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
import { AppButton, AppStack, AppText } from '@/ui/components'
import { tokens } from '@/ui/tokens'

const CONTENT_MAX_WIDTH = 720

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentBase: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    minHeight: 0,
  },
  desktopContent: {
    maxWidth: CONTENT_MAX_WIDTH,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  scroll: { flex: 1 },
})

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <CreateTodoModal />

      {isPending ? (
        <View className="flex-1 items-center justify-center bg-bg">
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : null}

      {isError ? (
        <View className="flex-1 items-center justify-center bg-bg px-4">
          <AppText tone="danger" className="text-center">
            {t('todos.loadError')}
          </AppText>
        </View>
      ) : null}

      {!isPending && !isError ? (
        <View
          className="flex-1 bg-bg"
          style={[
            styles.contentBase,
            breakpoint === 'desktop' ? styles.desktopContent : undefined,
          ]}
        >
          <View className="flex-row items-center justify-between border-b border-border bg-bg px-5 py-3">
            <AppText testID="todos-title" size="xl" weight="bold">
              {t('todos.title')}
            </AppText>
            <AppButton
              testID="create-todo-button"
              size="sm"
              onPress={() => {
                setSelectedTodoId(null)
                openModal()
              }}
            >
              {t('todos.create')}
            </AppButton>
          </View>

          <FilterTabs value={filter} onChange={setFilter} />

          <ScrollView style={styles.scroll} contentContainerStyle={styles.listContent}>
            {todos?.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}

            {todos?.length === 0 ? (
              <AppStack gap={4} className="flex-1 items-center justify-center p-6">
                <AppText testID="todos-empty" tone="muted" className="text-center">
                  {t('todos.empty')}
                </AppText>
                <AppButton
                  testID="create-todo-button-empty"
                  onPress={() => {
                    setSelectedTodoId(null)
                    openModal()
                  }}
                >
                  {t('todos.create')}
                </AppButton>
              </AppStack>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </SafeAreaView>
  )
}
