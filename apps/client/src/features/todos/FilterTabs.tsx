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
      paddingHorizontal="$5"
      paddingVertical="$3"
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
            accessibilityRole="button"
            accessibilityLabel={t(`todos.filter.${filter}`)}
            accessibilityState={{ selected: isSelected }}
            flex={1}
            size="$3"
            height={36}
            backgroundColor={isSelected ? '$primary' : 'transparent'}
            borderWidth={isSelected ? 0 : 1}
            borderColor="$borderColor"
            borderRadius="$4"
            color={isSelected ? '$white' : '$colorSecondary'}
            onPress={() => onChange(filter)}
            unstyled
            justifyContent="center"
            alignItems="center"
          >
            <Text
              fontSize={14}
              fontWeight={isSelected ? '600' : '400'}
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
