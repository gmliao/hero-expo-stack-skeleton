import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Input, Sheet, Spinner, Text, XStack, YStack } from 'tamagui'

import type { Todo } from '@shared/types/api'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useUpdateTodoMutation } from '@/data/hooks/useUpdateTodoMutation'
import { queryKeys } from '@/data/queryKeys'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

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
    <Sheet
      modal
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) handleClose()
      }}
      snapPoints={[55]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay
        animation="quick"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0, 0, 0, 0.5)"
      />
      <Sheet.Handle />
      <Sheet.Frame paddingHorizontal="$5" paddingVertical="$6" backgroundColor="$background">
        <YStack gap="$5">
          <Text
            testID="create-todo-modal-title"
            fontSize={22}
            fontWeight="700"
            color="$color"
            accessibilityRole="header"
          >
            {t(isEdit ? 'todos.modal.editTitle' : 'todos.modal.title')}
          </Text>

          <YStack gap="$1">
            <Input
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
              size="$5"
              fontSize={16}
              borderRadius="$4"
              borderColor={titleError ? '$danger' : '$borderColor'}
            />
            {titleError && (
              <Text
                testID="create-todo-title-error"
                color="$danger"
                fontSize="$2"
                accessibilityLiveRegion="polite"
              >
                {titleError}
              </Text>
            )}
          </YStack>

          <YStack gap="$1">
            <Text fontSize={14} color="$colorSecondary" accessibilityLabel={t('todos.modal.description')}>
              {t('todos.modal.description')}
            </Text>
            <Input
              testID="create-todo-description"
              accessibilityLabel={t('todos.modal.description')}
              placeholder={t('todos.modal.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              size="$4"
              fontSize={16}
              borderRadius="$4"
              borderColor="$borderColor"
              minHeight={80}
            />
          </YStack>

          <YStack gap="$1">
            <Text fontSize={14} color="$colorSecondary" accessibilityLabel={t('todos.modal.dueDate')}>
              {t('todos.modal.dueDate')}
            </Text>
            <Input
              testID="create-todo-due-date"
              accessibilityLabel={t('todos.modal.dueDate')}
              placeholder={t('todos.modal.dueDatePlaceholder')}
              value={dueDate}
              onChangeText={setDueDate}
              size="$4"
              fontSize={16}
              borderRadius="$4"
              borderColor="$borderColor"
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </YStack>

          {saveError && (
            <Text
              testID="create-todo-save-error"
              color="$danger"
              fontSize="$2"
              accessibilityLiveRegion="polite"
            >
              {saveError}
            </Text>
          )}

          <XStack gap="$3" justifyContent="flex-end">
            <Button
              testID="create-todo-cancel"
              onPress={handleClose}
              variant="outlined"
              size="$4"
              height={44}
              borderRadius="$4"
              borderColor="$borderColor"
              color="$colorSecondary"
              disabled={isPending}
              accessibilityLabel={t('todos.modal.cancel')}
              justifyContent="center"
              alignItems="center"
              fontSize={16}
            >
              {t('todos.modal.cancel')}
            </Button>
            <Button
              testID="create-todo-save"
              onPress={handleSave}
              backgroundColor="$primary"
              color="$white"
              size="$4"
              height={44}
              borderRadius="$4"
              disabled={isPending}
              icon={isPending ? <Spinner color="$white" /> : undefined}
              accessibilityLabel={t('todos.modal.save')}
              justifyContent="center"
              alignItems="center"
              fontSize={16}
            >
              {t('todos.modal.save')}
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
