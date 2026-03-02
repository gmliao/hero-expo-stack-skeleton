import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { useDeleteTagMutation } from '@/data/hooks/useDeleteTagMutation'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { useUpdateTagMutation } from '@/data/hooks/useUpdateTagMutation'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  AppButton,
  AppInput,
  AppScreenContainer,
  AppStack,
  AppTagBadge,
  AppText,
} from '@/ui/components'

export default function ManageTagsScreen() {
  const { t } = useTranslation()
  const uid = useAuthStore(s => s.uid) ?? ''
  const { data: tags = [] } = useTagsQuery(uid)
  const updateTagMutation = useUpdateTagMutation()
  const deleteTagMutation = useDeleteTagMutation()

  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  function startRename(tagId: string, currentName: string) {
    setEditingTagId(tagId)
    setEditingName(currentName)
  }

  function cancelRename() {
    setEditingTagId(null)
    setEditingName('')
  }

  function submitRename() {
    if (!editingTagId || !editingName.trim()) return
    updateTagMutation.mutate(
      { tagId: editingTagId, body: { name: editingName.trim() } },
      {
        onSuccess: () => {
          setEditingTagId(null)
          setEditingName('')
        },
      },
    )
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
                    {editingTagId === tag.id ? (
                      <>
                        <AppInput
                          testID="manage-tags-edit-input"
                          value={editingName}
                          onChangeText={setEditingName}
                          placeholder={t('manageTags.title')}
                          size="md"
                          className="flex-1 min-w-0"
                          accessibilityLabel={t('manageTags.rename')}
                        />
                        <AppButton
                          testID="manage-tags-edit-cancel"
                          variant="secondary"
                          onPress={cancelRename}
                          accessibilityLabel={t('todos.modal.cancel')}
                        >
                          {t('todos.modal.cancel')}
                        </AppButton>
                        <AppButton
                          testID="manage-tags-edit-save"
                          variant="primary"
                          onPress={submitRename}
                          disabled={
                            updateTagMutation.isPending || !editingName.trim()
                          }
                          accessibilityLabel={t('todos.modal.save')}
                        >
                          {t('todos.modal.save')}
                        </AppButton>
                      </>
                    ) : (
                      <>
                        <AppTagBadge
                          name={tag.name}
                          testID={`manage-tags-badge-${tag.id}`}
                        />
                        <AppButton
                          testID={`manage-tags-rename-${tag.id}`}
                          variant="outline"
                          onPress={() => startRename(tag.id, tag.name)}
                          accessibilityLabel={`${t('manageTags.rename')} ${tag.name}`}
                        >
                          {t('manageTags.rename')}
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
                    )}
                  </View>
                ))}
              </AppStack>
            </ScrollView>
          </AppStack>
        </AppScreenContainer>
      </View>
    </SafeAreaView>
  )
}
