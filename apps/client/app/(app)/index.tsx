import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Platform, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { Todo } from '@shared/types/api'
import { useDeleteTodoMutation } from '@/data/hooks/useDeleteTodoMutation'
import { useTodosQuery } from '@/data/hooks/useTodosQuery'
import { useToggleTodoMutation } from '@/data/hooks/useToggleTodoMutation'
import { CreateTodoModal } from '@/features/todos/CreateTodoModal'
import { FilterTabs } from '@/features/todos/FilterTabs'
import { TagFilters } from '@/features/todos/TagFilters'
import { TodosList } from '@/features/todos/TodosList'
import { TodosScreenHeader } from '@/features/todos/TodosScreenHeader'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { AppScreenContainer, AppText } from '@/ui/components'
import { tokens } from '@/ui/tokens'

export default function TodosScreen() {
  const { t } = useTranslation()
  const uid = useAuthStore(s => s.uid) ?? ''
  const filter = useUIStore(s => s.filter)
  const selectedTagId = useUIStore(s => s.selectedTagId)
  const setFilter = useUIStore(s => s.setFilter)
  const setSelectedTagId = useUIStore(s => s.setSelectedTagId)
  const { data: todos, isPending, isError } = useTodosQuery(uid, filter, selectedTagId)
  const toggleMutation = useToggleTodoMutation()
  const deleteMutation = useDeleteTodoMutation()
  const openModal = useUIStore(s => s.openCreateModal)
  const setSelectedTodoId = useUIStore(s => s.setSelectedTodoId)


  const handleCreatePress = useCallback(() => {
    setSelectedTodoId(null)
    openModal()
  }, [setSelectedTodoId, openModal])

  const handleToggle = useCallback(
    (id: string) => toggleMutation.mutate(id),
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
      if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
        const ok = globalThis.confirm(
          `${t('todos.deleteConfirmTitle')}\n\n${t('todos.deleteConfirmMessage')}`,
        )
        if (ok) {
          deleteMutation.mutate(todo.id)
        }
        return
      }
      Alert.alert(
        t('todos.deleteConfirmTitle'),
        t('todos.deleteConfirmMessage'),
        [
          { text: t('todos.deleteConfirmCancel'), style: 'cancel' },
          {
            text: t('todos.deleteConfirmDelete'),
            style: 'destructive',
            onPress: () => deleteMutation.mutate(todo.id),
          },
        ],
      )
    },
    [t, deleteMutation],
  )

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <CreateTodoModal />

      {isPending && (
        <View className="flex-1 items-center justify-center bg-bg">
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      )}

      {isError && (
        <View className="flex-1 items-center justify-center bg-bg px-4">
          <AppText tone="danger" className="text-center">
            {t('todos.loadError')}
          </AppText>
        </View>
      )}

      {!isPending && !isError && (
        <View className="flex-1 bg-bg">
          <AppScreenContainer className="flex-1">
            <TodosScreenHeader onCreatePress={handleCreatePress} />
            <FilterTabs value={filter} onChange={setFilter} />
            <TagFilters
              uid={uid}
              selectedTagId={selectedTagId}
              setSelectedTagId={setSelectedTagId}
            />
            <TodosList
              todos={todos}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreatePress={handleCreatePress}
            />
          </AppScreenContainer>
        </View>
      )}
    </SafeAreaView>
  )
}
