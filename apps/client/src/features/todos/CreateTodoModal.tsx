import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

import type { Todo } from '@shared/types/api'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useUpdateTodoMutation } from '@/data/hooks/useUpdateTodoMutation'
import { queryKeys } from '@/data/queryKeys'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { AppButton, AppInput, AppStack, AppText } from '@/ui/components'

/** Normalize dueDate to YYYY-MM-DD for date input */
function toDateOnly(value: string | undefined): string {
  if (!value) return ''
  return value.includes('T') ? value.slice(0, 10) : value.slice(0, 10)
}

function findTodoFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  uid: string,
  todoId: string,
  filter: string,
): Todo | undefined {
  const fromList = (f: string) =>
    queryClient.getQueryData<Todo[]>(queryKeys.todos.list(uid, f))
  const list = fromList(filter) ?? fromList('all')
  return list?.find(t => t.id === todoId)
}

export function CreateTodoModal() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const uid = useAuthStore(s => s.uid) ?? ''
  const isOpen = useUIStore(s => s.isCreateModalOpen)
  const closeModal = useUIStore(s => s.closeCreateModal)
  const filter = useUIStore(s => s.filter)
  const selectedTodoId = useUIStore(s => s.selectedTodoId)
  const setSelectedTodoId = useUIStore(s => s.setSelectedTodoId)

  const createMutation = useCreateTodoMutation()
  const updateMutation = useUpdateTodoMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isEdit = selectedTodoId !== null
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!isOpen) return
    if (selectedTodoId) {
      const todo = findTodoFromCache(queryClient, uid, selectedTodoId, filter)
      if (todo) {
        setTitle(todo.title)
        setDescription(todo.description ?? '')
        setDueDate(toDateOnly(todo.dueDate))
      } else {
        setTitle('')
        setDescription('')
        setDueDate('')
      }
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
    }
    setTitleError(null)
    setSaveError(null)
  }, [isOpen, selectedTodoId, uid, filter, queryClient])

  function handleClose() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setTitleError(null)
    setSaveError(null)
    setSelectedTodoId(null)
    closeModal()
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleError(t('todos.modal.titleRequired'))
      return
    }

    setTitleError(null)
    setSaveError(null)

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate.trim() || undefined,
    }

    try {
      if (isEdit && selectedTodoId) {
        await updateMutation.mutateAsync({ id: selectedTodoId, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setTitle('')
      setDescription('')
      setDueDate('')
      setSelectedTodoId(null)
      closeModal()
    } catch {
      setSaveError(t('todos.modal.saveError'))
    }
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={handleClose} />

        <View className="rounded-t-3xl border border-border bg-surface px-5 py-6">
          <AppStack gap={5}>
            <AppText
              testID="create-todo-modal-title"
              size="xl"
              weight="bold"
              accessibilityRole="header"
            >
              {t(isEdit ? 'todos.modal.editTitle' : 'todos.modal.title')}
            </AppText>

            <AppStack gap={1}>
              <AppInput
                testID="create-todo-input"
                accessibilityLabel={t('todos.modal.placeholder')}
                placeholder={t('todos.modal.placeholder')}
                value={title}
                onChangeText={text => {
                  setTitle(text)
                  if (titleError) setTitleError(null)
                }}
                autoFocus
                returnKeyType="next"
                size="md"
                invalid={Boolean(titleError)}
              />

              {titleError ? (
                <AppText
                  testID="create-todo-title-error"
                  tone="danger"
                  size="sm"
                  accessibilityLiveRegion="polite"
                >
                  {titleError}
                </AppText>
              ) : null}
            </AppStack>

            <AppStack gap={1}>
              <AppText size="sm" tone="muted" accessibilityLabel={t('todos.modal.description')}>
                {t('todos.modal.description')}
              </AppText>
              <AppInput
                testID="create-todo-description"
                accessibilityLabel={t('todos.modal.description')}
                placeholder={t('todos.modal.descriptionPlaceholder')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="h-24 py-3"
              />
            </AppStack>

            <AppStack gap={1}>
              <AppText size="sm" tone="muted" accessibilityLabel={t('todos.modal.dueDate')}>
                {t('todos.modal.dueDate')}
              </AppText>
              <AppInput
                testID="create-todo-due-date"
                accessibilityLabel={t('todos.modal.dueDate')}
                placeholder={t('todos.modal.dueDatePlaceholder')}
                value={dueDate}
                onChangeText={setDueDate}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </AppStack>

            {saveError ? (
              <AppText
                testID="create-todo-save-error"
                tone="danger"
                size="sm"
                accessibilityLiveRegion="polite"
              >
                {saveError}
              </AppText>
            ) : null}

            <AppStack direction="horizontal" gap={3} className="justify-end">
              <AppButton
                testID="create-todo-cancel"
                variant="secondary"
                onPress={handleClose}
                disabled={isPending}
                accessibilityLabel={t('todos.modal.cancel')}
              >
                {t('todos.modal.cancel')}
              </AppButton>

              <AppButton
                testID="create-todo-save"
                onPress={handleSave}
                disabled={isPending}
                isLoading={isPending}
                accessibilityLabel={t('todos.modal.save')}
              >
                {t('todos.modal.save')}
              </AppButton>
            </AppStack>
          </AppStack>
        </View>
      </View>
    </Modal>
  )
}
