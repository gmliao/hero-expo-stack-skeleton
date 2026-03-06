import { useLayoutEffect, useRef, useState } from 'react'
import { Keyboard, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { CreateTagRequest, TagColorToken } from '@shared/types/api'
import {
  AppButton,
  AppHorizontalScrollArea,
  AppInput,
  AppStack,
  AppTagBadge,
  AppTagChip,
  AppText,
  ModalFormSheet,
} from '@/ui/components'

const EMOJI_OPTIONS = ['🧰', '🏠', '📚', '⚡', '🛒'] as const
const COLOR_OPTIONS: TagColorToken[] = [
  'tagTeal',
  'tagBlue',
  'tagGreen',
  'tagAmber',
  'tagRose',
]

const DEFAULT_VALUES: CreateTagRequest = {
  name: '',
  emoji: EMOJI_OPTIONS[0],
  colorToken: COLOR_OPTIONS[0],
}

type TagFormValues = CreateTagRequest

interface TagFormModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  initialValues?: TagFormValues
  onClose: () => void
  onSubmit: (values: TagFormValues) => void
  isPending: boolean
}

export function TagFormModal({
  visible,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isPending,
}: TagFormModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(DEFAULT_VALUES.name)
  const [emoji, setEmoji] = useState<CreateTagRequest['emoji']>(
    DEFAULT_VALUES.emoji,
  )
  const [colorToken, setColorToken] = useState<TagColorToken>(
    DEFAULT_VALUES.colorToken,
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const nameInputRef = useRef<TextInput>(null)

  useLayoutEffect(() => {
    if (!visible) return
    setName(initialValues?.name ?? DEFAULT_VALUES.name)
    setEmoji(initialValues?.emoji ?? DEFAULT_VALUES.emoji)
    setColorToken(initialValues?.colorToken ?? DEFAULT_VALUES.colorToken)
    setNameError(null)
  }, [
    initialValues?.name,
    initialValues?.emoji,
    initialValues?.colorToken,
    visible,
  ])

  function handleSubmit() {
    Keyboard.dismiss()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError(t('tags.form.nameRequired'))
      return
    }

    setNameError(null)
    onSubmit({
      name: trimmedName,
      emoji,
      colorToken,
    })
  }

  return (
    <ModalFormSheet
      visible={visible}
      onClose={onClose}
      placement="center"
      maxWidth={420}
      testID="tag-form-card"
      footer={
        <AppStack direction="horizontal" gap={3} className="justify-end">
          <AppButton
            testID="tag-form-cancel"
            variant="secondary"
            onPress={onClose}
            disabled={isPending}
          >
            {t('common.cancel')}
          </AppButton>
          <AppButton
            testID="tag-form-save"
            onPress={handleSubmit}
            isLoading={isPending}
            disabled={isPending}
          >
            {t(
              mode === 'create'
                ? 'tags.form.createAction'
                : 'tags.form.saveAction',
            )}
          </AppButton>
        </AppStack>
      }
    >
      <AppStack gap={4}>
        <AppText
          testID="tag-form-title"
          size="xl"
          weight="bold"
          accessibilityRole="header"
        >
          {t(
            mode === 'create' ? 'tags.form.createTitle' : 'tags.form.editTitle',
          )}
        </AppText>

        <AppStack gap={1}>
          <AppText size="sm" tone="muted">
            {t('tags.form.preview')}
          </AppText>
          <AppTagBadge
            testID="tag-form-preview"
            name={name.trim() || t('tags.form.previewFallback')}
            emoji={emoji}
            colorToken={colorToken}
          />
        </AppStack>

        <AppStack gap={1}>
          <AppText size="sm" tone="muted">
            {t('tags.form.nameLabel')}
          </AppText>
          <AppInput
            ref={nameInputRef}
            testID="tag-form-name-input"
            value={name}
            onChangeText={(text) => {
              setName(text)
              if (nameError) setNameError(null)
            }}
            placeholder={t('tags.form.namePlaceholder')}
            invalid={Boolean(nameError)}
            accessibilityLabel={t('tags.form.nameLabel')}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {nameError ? (
            <AppText testID="tag-form-name-error" size="sm" tone="danger">
              {nameError}
            </AppText>
          ) : null}
        </AppStack>

        <AppStack gap={2}>
          <AppText size="sm" tone="muted">
            {t('tags.form.emojiLabel')}
          </AppText>
          <AppHorizontalScrollArea gap={8}>
            {EMOJI_OPTIONS.map((option) => (
              <AppTagChip
                key={option}
                testID={`tag-form-emoji-${option}`}
                name={option}
                active={emoji === option}
                onPress={() => setEmoji(option)}
              />
            ))}
          </AppHorizontalScrollArea>
        </AppStack>

        <AppStack gap={2}>
          <AppText size="sm" tone="muted">
            {t('tags.form.colorLabel')}
          </AppText>
          <AppHorizontalScrollArea gap={8}>
            {COLOR_OPTIONS.map((option) => (
              <AppTagChip
                key={option}
                testID={`tag-form-color-${option}`}
                name={t(`tags.colors.${option}`)}
                emoji={emoji}
                colorToken={option}
                active={colorToken === option}
                onPress={() => setColorToken(option)}
              />
            ))}
          </AppHorizontalScrollArea>
        </AppStack>
      </AppStack>
    </ModalFormSheet>
  )
}
