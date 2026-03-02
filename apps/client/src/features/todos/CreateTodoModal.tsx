import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

import type { Todo } from '@shared/types/api'
import { useCreateTagMutation } from '@/data/hooks/useCreateTagMutation'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { useUpdateTodoMutation } from '@/data/hooks/useUpdateTodoMutation'
import { queryKeys } from '@/data/queryKeys'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { AppButton, AppInput, AppLinkAction, AppStack, AppText, AppTextArea } from '@/ui/components'
import { cn } from '@/ui/utils/cn'

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
  selectedTagId?: string | null,
): Todo | undefined {
  const fromList = (f: string) =>
    queryClient.getQueryData<Todo[]>(queryKeys.todos.list(uid, f, selectedTagId ?? undefined))
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
  const selectedTagId = useUIStore(s => s.selectedTagId)
  const selectedTodoId = useUIStore(s => s.selectedTodoId)
  const setSelectedTodoId = useUIStore(s => s.setSelectedTodoId)

  const createMutation = useCreateTodoMutation()
  const updateMutation = useUpdateTodoMutation()
  const { data: tags = [] } = useTagsQuery(uid)
  const createTagMutation = useCreateTagMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [addTagInlineVisible, setAddTagInlineVisible] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  const isEdit = selectedTodoId !== null
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!isOpen) return
    if (selectedTodoId) {
      const todo = findTodoFromCache(queryClient, uid, selectedTodoId, filter, selectedTagId)
      if (todo) {
        setTitle(todo.title)
        setDescription(todo.description ?? '')
        setDueDate(toDateOnly(todo.dueDate))
        setSelectedTagIds(todo.tagIds ?? [])
      } else {
        setTitle('')
        setDescription('')
        setDueDate('')
        setSelectedTagIds([])
      }
      setAddTagInlineVisible(false)
      setNewTagName('')
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setSelectedTagIds([])
      setAddTagInlineVisible(false)
      setNewTagName('')
    }
    setTitleError(null)
  }, [isOpen, selectedTodoId, uid, filter, selectedTagId, queryClient])

  function handleClose() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setTitleError(null)
    setSelectedTagIds([])
    setAddTagInlineVisible(false)
    setNewTagName('')
    setSelectedTodoId(null)
    closeModal()
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleError(t('todos.modal.titleRequired'))
      return
    }

    setTitleError(null)

    try {
      if (isEdit && selectedTodoId) {
        await updateMutation.mutateAsync({
          id: selectedTodoId,
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate.trim() ? dueDate.trim() : null, // null = clear
          tagIds: selectedTagIds,
        })
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate.trim() || undefined, // create doesn't support null
          tagIds: selectedTagIds,
        })
      }
      setTitle('')
      setDescription('')
      setDueDate('')
      setSelectedTodoId(null)
      closeModal()
    } catch {
      // QueryClient global mutation onError owns user-visible error surfacing.
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

        <View className="max-h-[85%] rounded-t-3xl border border-border bg-surface px-5 py-6">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
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
              <AppTextArea
                testID="create-todo-description"
                accessibilityLabel={t('todos.modal.description')}
                placeholder={t('todos.modal.descriptionPlaceholder')}
                value={description}
                onChangeText={setDescription}
                size="md"
                className="min-h-24"
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

            <AppStack gap={2}>
              <View className="flex-row items-center justify-between">
                <AppText
                  size="sm"
                  tone="muted"
                  accessibilityLabel={t('todos.tagsLabel')}
                >
                  {t('todos.tagsLabel')}
                </AppText>
                <AppLinkAction
                  testID="create-todo-add-tag"
                  onPress={() => setAddTagInlineVisible(true)}
                  accessibilityLabel={t('todos.modal.addTag')}
                >
                  {t('todos.modal.addTag')}
                </AppLinkAction>
              </View>
              {addTagInlineVisible ? (
                <View className="flex-row items-center gap-2">
                  <AppInput
                    testID="create-todo-new-tag-input"
                    placeholder={t('todos.tagsLabel')}
                    value={newTagName}
                    onChangeText={setNewTagName}
                    size="md"
                    className="flex-1"
                    accessibilityLabel={t('todos.modal.addTag')}
                  />
                  <AppButton
                    testID="create-todo-new-tag-add"
                    variant="secondary"
                    onPress={() => {
                      const name = newTagName.trim()
                      if (!name) return
                      createTagMutation.mutate(
                        { name },
                        {
                          onSuccess: (data) => {
                            setSelectedTagIds(prev => [...prev, data.id])
                            setNewTagName('')
                            setAddTagInlineVisible(false)
                          },
                        },
                      )
                    }}
                    disabled={createTagMutation.isPending || !newTagName.trim()}
                    accessibilityLabel={t('todos.modal.addTagButton')}
                  >
                    {t('todos.modal.addTagButton')}
                  </AppButton>
                </View>
              ) : null}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                className="flex-row items-center"
              >
                {tags.map(tag => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <Pressable
                      key={tag.id}
                      testID={`create-todo-tag-${tag.id}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={tag.name}
                      onPress={() => {
                        setSelectedTagIds(prev =>
                          selected ? prev.filter(id => id !== tag.id) : [...prev, tag.id],
                        )
                      }}
                      className={cn(
                        'h-8 flex-row items-center justify-center rounded-full border px-3',
                        selected ? 'border-primary bg-primary' : 'border-border bg-transparent',
                      )}
                    >
                      <AppText
                        size="sm"
                        weight="medium"
                        tone={selected ? 'inverse' : 'muted'}
                        numberOfLines={1}
                      >
                        {tag.name}
                      </AppText>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </AppStack>

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
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
