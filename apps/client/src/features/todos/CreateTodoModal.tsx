import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

import type { Tag, Todo } from '@shared/types/api'
import { useCreateTagMutation } from '@/data/hooks/useCreateTagMutation'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { useUpdateTodoMutation } from '@/data/hooks/useUpdateTodoMutation'
import { queryKeys } from '@/data/queryKeys'
import { useBreakpoint } from '@/lib/useBreakpoint'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import {
  AppButton,
  AppHorizontalScrollArea,
  AppLinkAction,
  AppStack,
  AppInput,
  AppTagChip,
  AppText,
  AppTextArea,
  ModalFormSheet,
  SCREEN_CONTENT_MAX_WIDTH,
} from '@/ui/components'
import { TagFormModal } from './TagFormModal'

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
  const fromList = (f: string, tagId?: string | null) =>
    queryClient.getQueryData<Todo[]>(queryKeys.todos.list(uid, f, tagId))
  const list =
    fromList(filter, selectedTagId) ??
    fromList(filter, undefined) ??
    fromList('all', selectedTagId) ??
    fromList('all', undefined)
  return list?.find((t) => t.id === todoId)
}

export function CreateTodoModal() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const uid = useAuthStore((s) => s.uid) ?? ''
  const isOpen = useUIStore((s) => s.isCreateModalOpen)
  const closeModal = useUIStore((s) => s.closeCreateModal)
  const filter = useUIStore((s) => s.filter)
  const selectedTagId = useUIStore((s) => s.selectedTagId)
  const selectedTodoId = useUIStore((s) => s.selectedTodoId)
  const setSelectedTodoId = useUIStore((s) => s.setSelectedTodoId)

  const createMutation = useCreateTodoMutation()
  const updateMutation = useUpdateTodoMutation()
  const { data: tags = [] } = useTagsQuery(uid)
  const createTagMutation = useCreateTagMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [createdTags, setCreatedTags] = useState<Tag[]>([])
  const [isTagFormOpen, setIsTagFormOpen] = useState(false)
  const descriptionRef = useRef<TextInput>(null)
  const dueDateRef = useRef<TextInput>(null)

  const isEdit = selectedTodoId !== null
  const isPending = createMutation.isPending || updateMutation.isPending
  const isDesktop = useBreakpoint() === 'desktop'
  const availableTags = [
    ...tags,
    ...createdTags.filter(
      (tag) => !tags.some((existing) => existing.id === tag.id),
    ),
  ]

  useEffect(() => {
    if (!isOpen) return
    if (selectedTodoId) {
      const todo = findTodoFromCache(
        queryClient,
        uid,
        selectedTodoId,
        filter,
        selectedTagId,
      )
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
      setCreatedTags([])
      setIsTagFormOpen(false)
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setSelectedTagIds([])
      setCreatedTags([])
      setIsTagFormOpen(false)
    }
    setTitleError(null)
  }, [isOpen, selectedTodoId, uid, filter, selectedTagId, queryClient])

  function handleClose() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setTitleError(null)
    setSelectedTagIds([])
    setCreatedTags([])
    setIsTagFormOpen(false)
    setSelectedTodoId(null)
    closeModal()
  }

  async function handleSave() {
    Keyboard.dismiss()
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
      setCreatedTags([])
      setSelectedTodoId(null)
      closeModal()
    } catch {
      // QueryClient global mutation onError owns user-visible error surfacing.
    }
  }

  async function handleCreateTag(values: {
    name: string
    emoji: string
    colorToken: Tag['colorToken']
  }) {
    try {
      const tag = await createTagMutation.mutateAsync(values)
      setCreatedTags((prev) => [...prev, tag])
      setSelectedTagIds((prev) =>
        prev.includes(tag.id) ? prev : [...prev, tag.id],
      )
      setIsTagFormOpen(false)
    } catch {
      // Mutation-level error handling owns visible error state.
    }
  }

  return (
    <>
      <ModalFormSheet
        visible={isOpen}
        onClose={handleClose}
        placement="center"
        maxWidth={isDesktop ? SCREEN_CONTENT_MAX_WIDTH : undefined}
        footer={
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
        }
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
              onChangeText={(text) => {
                setTitle(text)
                if (titleError) setTitleError(null)
              }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => descriptionRef.current?.focus()}
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
            <AppText
              size="sm"
              tone="muted"
              accessibilityLabel={t('todos.modal.description')}
            >
              {t('todos.modal.description')}
            </AppText>
            <AppTextArea
              ref={descriptionRef}
              testID="create-todo-description"
              accessibilityLabel={t('todos.modal.description')}
              placeholder={t('todos.modal.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              returnKeyType="next"
              blurOnSubmit
              onSubmitEditing={() => dueDateRef.current?.focus()}
              size="md"
              className="min-h-24"
            />
          </AppStack>

          <AppStack gap={1}>
            <AppText
              size="sm"
              tone="muted"
              accessibilityLabel={t('todos.modal.dueDate')}
            >
              {t('todos.modal.dueDate')}
            </AppText>
            <AppInput
              ref={dueDateRef}
              testID="create-todo-due-date"
              accessibilityLabel={t('todos.modal.dueDate')}
              placeholder={t('todos.modal.dueDatePlaceholder')}
              value={dueDate}
              onChangeText={setDueDate}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleSave()
              }}
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
              {availableTags.length > 0 ? (
                <AppLinkAction
                  testID="create-todo-new-tag"
                  onPress={() => setIsTagFormOpen(true)}
                  accessibilityLabel={t('todos.modal.newTag')}
                >
                  {t('todos.modal.newTag')}
                </AppLinkAction>
              ) : null}
            </View>
            {availableTags.length === 0 ? (
              <AppStack
                gap={3}
                className="rounded-2xl border border-dashed border-border bg-bg p-4"
              >
                <AppText testID="create-todo-empty-tags" size="sm" tone="muted">
                  {t('todos.modal.noTags')}
                </AppText>
                <AppButton
                  testID="create-todo-create-first-tag"
                  variant="secondary"
                  onPress={() => setIsTagFormOpen(true)}
                  accessibilityLabel={t('todos.modal.createFirstTag')}
                >
                  {t('todos.modal.createFirstTag')}
                </AppButton>
              </AppStack>
            ) : (
              <AppHorizontalScrollArea
                gap={8}
                className="flex-row items-center"
              >
                {availableTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <AppTagChip
                      key={tag.id}
                      testID={`create-todo-tag-${tag.id}`}
                      name={tag.name}
                      emoji={tag.emoji}
                      colorToken={tag.colorToken}
                      accessibilityLabel={tag.name}
                      active={selected}
                      onPress={() => {
                        setSelectedTagIds((prev) =>
                          selected
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id],
                        )
                      }}
                    />
                  )
                })}
              </AppHorizontalScrollArea>
            )}
          </AppStack>
        </AppStack>
      </ModalFormSheet>
      <TagFormModal
        visible={isTagFormOpen}
        mode="create"
        onClose={() => setIsTagFormOpen(false)}
        onSubmit={handleCreateTag}
        isPending={createTagMutation.isPending}
      />
    </>
  )
}
