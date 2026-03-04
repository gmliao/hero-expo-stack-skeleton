import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { AppTagChip, AppText } from '@/ui/components'

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
        <AppTagChip
          testID="tag-filter-all"
          name={t('todos.tagFilterAll')}
          onPress={() => setSelectedTagId(null)}
          active={isAllSelected}
          className="min-w-[4rem] px-4"
        />
        {tags.map(tag => {
          const selected = tag.id === selectedTagId
          return (
            <AppTagChip
              key={tag.id}
              testID={`tag-filter-${tag.id}`}
              name={tag.name}
              emoji={tag.emoji}
              colorToken={tag.colorToken}
              accessibilityLabel={tag.name}
              active={selected}
              onPress={() => setSelectedTagId(selected ? null : tag.id)}
            />
          )
        })}
      </ScrollView>
    </View>
  )
}
