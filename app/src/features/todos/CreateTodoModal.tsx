import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Sheet, Spinner, Text, XStack, YStack } from 'tamagui'

import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useUIStore } from '@/stores/useUIStore'

export function CreateTodoModal() {
  const { t } = useTranslation()
  const isOpen = useUIStore(s => s.isCreateModalOpen)
  const closeModal = useUIStore(s => s.closeCreateModal)
  const createMutation = useCreateTodoMutation()

  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleClose() {
    setTitle('')
    setTitleError(null)
    setSaveError(null)
    closeModal()
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleError(t('todos.modal.titleRequired'))
      return
    }

    setTitleError(null)
    setSaveError(null)

    try {
      await createMutation.mutateAsync({ title: title.trim() })
      setTitle('')
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
      snapPoints={[45]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay
        animation="quick"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Handle />
      <Sheet.Frame padding="$5" backgroundColor="$background">
        <YStack gap="$4">
          <Text
            testID="create-todo-modal-title"
            fontSize="$6"
            fontWeight="700"
            color="$color"
          >
            {t('todos.modal.title')}
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
              returnKeyType="done"
              onSubmitEditing={handleSave}
              size="$5"
              borderColor={titleError ? '$danger' : '$borderColor'}
            />
            {titleError && (
              <Text
                testID="create-todo-title-error"
                color="$danger"
                fontSize="$2"
              >
                {titleError}
              </Text>
            )}
          </YStack>

          {saveError && (
            <Text
              testID="create-todo-save-error"
              color="$danger"
              fontSize="$2"
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
              disabled={createMutation.isPending}
            >
              {t('todos.modal.cancel')}
            </Button>
            <Button
              testID="create-todo-save"
              onPress={handleSave}
              backgroundColor="$primary"
              color="$white"
              size="$4"
              disabled={createMutation.isPending}
              icon={createMutation.isPending ? <Spinner color="$white" /> : undefined}
            >
              {t('todos.modal.save')}
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
