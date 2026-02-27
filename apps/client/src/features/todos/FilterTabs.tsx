import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppFilterChip } from '@/ui/components'

import type { Filter } from '@/stores/useUIStore'

const FILTERS: Filter[] = ['all', 'active', 'completed']

interface FilterTabsProps {
  value: Filter
  onChange: (filter: Filter) => void
}

export function FilterTabs({ value, onChange }: FilterTabsProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-row gap-2 border-b border-border bg-bg px-5 py-3">
      {FILTERS.map(filter => {
        const isSelected = value === filter
        return (
          <AppFilterChip
            key={filter}
            testID={`filter-tab-${filter}`}
            accessibilityLabel={t(`todos.filter.${filter}`)}
            active={isSelected}
            className="flex-1"
            onPress={() => onChange(filter)}
          >
            {t(`todos.filter.${filter}`)}
          </AppFilterChip>
        )
      })}
    </View>
  )
}
