import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, View } from 'react-native'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { AppText } from '@/ui/components'
import { cn } from '@/ui/utils/cn'

export interface TagFiltersProps {
  uid: string
  selectedTagId: string | null
  setSelectedTagId: (id: string | null) => void
}

export function TagFilters({ uid, selectedTagId, setSelectedTagId }: TagFiltersProps) {
  const { t } = useTranslation()
  const { data: tags = [] } = useTagsQuery(uid)

  const isAllSelected = selectedTagId === null

  return (
    <View className="min-h-12 flex-row items-center gap-2 border-b border-border bg-bg px-5 py-3">
      <AppText size="sm" tone="muted" className="mr-2">
        {t('todos.tagsLabel')}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        className="flex-1 flex-row items-center"
      >
        <Pressable
          testID="tag-filter-all"
          accessibilityRole="button"
          accessibilityState={{ selected: isAllSelected }}
          accessibilityLabel={t('todos.tagFilterAll')}
          onPress={() => setSelectedTagId(null)}
          className={cn(
            'h-8 min-w-[4rem] flex-row items-center justify-center rounded-full border px-4',
            isAllSelected ? 'border-primary bg-primary' : 'border-border bg-transparent',
          )}
        >
          <AppText size="sm" weight="medium" tone={isAllSelected ? 'inverse' : 'muted'}>
            {t('todos.tagFilterAll')}
          </AppText>
        </Pressable>
        {tags.map(tag => {
          const selected = tag.id === selectedTagId
          return (
            <Pressable
              key={tag.id}
              testID={`tag-filter-${tag.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={tag.name}
              onPress={() => setSelectedTagId(tag.id)}
              className={cn(
                'h-8 flex-row items-center justify-center rounded-full border px-3',
                selected ? 'border-primary bg-primary' : 'border-border bg-transparent',
              )}
            >
              <AppText size="sm" weight="medium" tone={selected ? 'inverse' : 'muted'} numberOfLines={1}>
                {tag.name}
              </AppText>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
