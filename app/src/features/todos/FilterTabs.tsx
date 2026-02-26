import { useTranslation } from 'react-i18next'
import { Button, Text, XStack } from 'tamagui'

import type { Filter } from '@/stores/useUIStore'

const FILTERS: Filter[] = ['all', 'active', 'completed']

interface FilterTabsProps {
  value: Filter
  onChange: (filter: Filter) => void
}

export function FilterTabs({ value, onChange }: FilterTabsProps) {
  const { t } = useTranslation()

  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$2"
      gap="$2"
      borderBottomWidth={1}
      borderColor="$borderColor"
      backgroundColor="$background"
    >
      {FILTERS.map(filter => {
        const isSelected = value === filter
        return (
          <Button
            key={filter}
            testID={`filter-tab-${filter}`}
            flex={1}
            size="$3"
            backgroundColor={isSelected ? '$primary' : 'transparent'}
            color={isSelected ? '$white' : '$colorSecondary'}
            onPress={() => onChange(filter)}
            unstyled
          >
            <Text
              fontSize="$3"
              fontWeight={isSelected ? '700' : '400'}
              color={isSelected ? '$white' : '$colorSecondary'}
            >
              {t(`todos.filter.${filter}`)}
            </Text>
          </Button>
        )
      })}
    </XStack>
  )
}
