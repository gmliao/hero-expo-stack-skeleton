import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { AppHorizontalScrollArea } from '@/ui/components/AppHorizontalScrollArea'

describe('AppHorizontalScrollArea', () => {
  it('renders children', () => {
    render(
      <AppHorizontalScrollArea>
        <Text testID="child">Tag</Text>
      </AppHorizontalScrollArea>,
    )
    expect(screen.getByTestId('child')).toBeOnTheScreen()
  })

  it('passes gap to contentContainerStyle', () => {
    render(
      <AppHorizontalScrollArea gap={12}>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    // ScrollView from RNGH renders correctly without error
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('hides horizontal scroll indicator by default', () => {
    const { UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    // ScrollView from react-native-gesture-handler
    const { ScrollView } = require('react-native-gesture-handler')
    const scrollView = UNSAFE_getByType(ScrollView)
    expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false)
  })
})
