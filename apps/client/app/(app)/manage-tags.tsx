import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import type { Tag } from '@shared/types/api'
import { useCreateTagMutation } from '@/data/hooks/useCreateTagMutation'
import { useDeleteTagMutation } from '@/data/hooks/useDeleteTagMutation'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { useUpdateTagMutation } from '@/data/hooks/useUpdateTagMutation'
import { TagFormModal } from '@/features/todos/TagFormModal'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  AppButton,
  AppScreenContainer,
  AppStack,
  AppTagBadge,
  AppText,
} from '@/ui/components'

export default function ManageTagsScreen() {
  const { t } = useTranslation()
  const uid = useAuthStore(s => s.uid) ?? ''
  const { data: tags = [] } = useTagsQuery(uid)
  const createTagMutation = useCreateTagMutation()
  const updateTagMutation = useUpdateTagMutation()
  const deleteTagMutation = useDeleteTagMutation()

  const [activeTag, setActiveTag] = useState<Tag | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  function openEdit(tag: Tag) {
    setActiveTag(tag)
  }

  function handleCloseForm() {
    setActiveTag(null)
    setIsCreateOpen(false)
  }

  function handleSubmit(values: { name: string; emoji: string; colorToken: Tag['colorToken'] }) {
    if (activeTag) {
      updateTagMutation.mutate(
        {
          tagId: activeTag.id,
          body: values,
        },
        {
          onSuccess: () => {
            handleCloseForm()
          },
        },
      )
      return
    }

    createTagMutation.mutate(values, {
      onSuccess: () => {
        handleCloseForm()
      },
    })
  }

  function handleDeletePress(tagId: string) {
    Alert.alert(
      t('manageTags.deleteConfirmTitle'),
      t('manageTags.deleteConfirmMessage'),
      [
        { text: t('manageTags.deleteConfirmCancel'), style: 'cancel' },
        {
          text: t('manageTags.deleteConfirmDelete'),
          style: 'destructive',
          onPress: () => deleteTagMutation.mutate(tagId),
        },
      ],
    )
  }

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <View className="flex-1 rounded-t-3xl border border-border bg-surface">
        <AppScreenContainer className="flex-1 px-5 py-6">
          <AppStack gap={5} className="flex-1">
            <Pressable
              onPress={() => router.back()}
              testID="manage-tags-back"
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <AppText size="md" tone="muted">
                ← {t('common.back')}
              </AppText>
            </Pressable>

            <AppText
              testID="manage-tags-title"
              size="xl"
              weight="bold"
              accessibilityRole="header"
            >
              {t('manageTags.title')}
            </AppText>

            <View className="flex-row justify-end">
              <AppButton
                testID="manage-tags-new-tag"
                variant="secondary"
                onPress={() => setIsCreateOpen(true)}
                accessibilityLabel={t('manageTags.newTag')}
              >
                {t('manageTags.newTag')}
              </AppButton>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <AppStack gap={3}>
                {tags.map(tag => (
                  <View
                    key={tag.id}
                    testID={`manage-tags-item-${tag.id}`}
                    className="flex-row flex-wrap items-center gap-2 rounded-lg border border-border bg-bg p-3"
                  >
                    <>
                      <AppTagBadge
                        name={tag.name}
                        emoji={tag.emoji}
                        colorToken={tag.colorToken}
                        testID={`manage-tags-badge-${tag.id}`}
                      />
                      <AppButton
                        testID={`manage-tags-edit-${tag.id}`}
                        variant="outline"
                        onPress={() => openEdit(tag)}
                        accessibilityLabel={`${t('manageTags.edit')} ${tag.name}`}
                      >
                        {t('manageTags.edit')}
                      </AppButton>
                      <AppButton
                        testID={`manage-tags-delete-${tag.id}`}
                        variant="destructive"
                        onPress={() => handleDeletePress(tag.id)}
                        accessibilityLabel={`${t('manageTags.delete')} ${tag.name}`}
                      >
                        {t('manageTags.delete')}
                      </AppButton>
                    </>
                  </View>
                ))}
              </AppStack>
            </ScrollView>
          </AppStack>
        </AppScreenContainer>
      </View>

      <TagFormModal
        visible={isCreateOpen || activeTag !== null}
        mode={activeTag ? 'edit' : 'create'}
        initialValues={
          activeTag
            ? {
                name: activeTag.name,
                emoji: activeTag.emoji,
                colorToken: activeTag.colorToken,
              }
            : undefined
        }
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        isPending={createTagMutation.isPending || updateTagMutation.isPending}
      />
    </SafeAreaView>
  )
}
