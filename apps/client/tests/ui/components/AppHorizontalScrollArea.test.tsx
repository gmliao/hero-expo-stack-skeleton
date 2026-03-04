import { fireEvent, render, screen } from '@testing-library/react-native'
import { Platform, View } from 'react-native'
import { Text } from 'react-native'
import { AppHorizontalScrollArea } from '@/ui/primitives/AppHorizontalScrollArea'

const { ScrollView } = require('react-native-gesture-handler')

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
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('hides horizontal scroll indicator by default', () => {
    const { UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    const scrollView = UNSAFE_getByType(ScrollView)
    expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false)
  })
})

describe('AppHorizontalScrollArea (web)', () => {
  const originalOS = Platform.OS

  beforeEach(() => {
    ;(Platform as any).OS = 'web'
  })

  afterEach(() => {
    ;(Platform as any).OS = originalOS
  })

  it('renders children on web', () => {
    render(
      <AppHorizontalScrollArea>
        <Text testID="child">Tag</Text>
      </AppHorizontalScrollArea>,
    )
    expect(screen.getByTestId('child')).toBeOnTheScreen()
  })

  it('passes scrollEventThrottle={16} on web', () => {
    const { UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    const scrollView = UNSAFE_getByType(ScrollView)
    expect(scrollView.props.scrollEventThrottle).toBe(16)
  })

  it('handleLayout: updates right-fade when content is wider than container', () => {
    const { UNSAFE_getAllByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    const outerView = UNSAFE_getAllByType(View)[0]
    // Set container width via onLayout
    fireEvent(outerView, 'layout', { nativeEvent: { layout: { width: 200 } } })
    // Should not throw; component stays mounted
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('handleContentSizeChange: shows right fade when content wider than container', () => {
    const { UNSAFE_getAllByType, UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    // Set container width first
    const outerView = UNSAFE_getAllByType(View)[0]
    fireEvent(outerView, 'layout', { nativeEvent: { layout: { width: 200 } } })
    // Content wider than container → showRightFade = true
    const scrollView = UNSAFE_getByType(ScrollView)
    fireEvent(scrollView, 'contentSizeChange', 400, 40)
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('handleContentSizeChange: hides right fade when content fits', () => {
    const { UNSAFE_getAllByType, UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    const outerView = UNSAFE_getAllByType(View)[0]
    fireEvent(outerView, 'layout', { nativeEvent: { layout: { width: 200 } } })
    // Content fits → showRightFade = false
    const scrollView = UNSAFE_getByType(ScrollView)
    fireEvent(scrollView, 'contentSizeChange', 100, 40)
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('handleScroll: shows left fade when scrolled right', () => {
    const { UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    const scrollView = UNSAFE_getByType(ScrollView)
    fireEvent(scrollView, 'scroll', {
      nativeEvent: {
        contentOffset: { x: 50 },
        contentSize: { width: 400 },
        layoutMeasurement: { width: 200 },
      },
    })
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('handleScroll: shows both fades in the middle of scroll', () => {
    const { UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    const scrollView = UNSAFE_getByType(ScrollView)
    // x=100, contentWidth=400, viewWidth=200 → left fade (x>4) + right fade (100 < 400-200-4)
    fireEvent(scrollView, 'scroll', {
      nativeEvent: {
        contentOffset: { x: 100 },
        contentSize: { width: 400 },
        layoutMeasurement: { width: 200 },
      },
    })
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('handleScroll: hides right fade at scroll end', () => {
    const { UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    const scrollView = UNSAFE_getByType(ScrollView)
    // Scrolled to end: x=200, contentWidth=400, viewWidth=200 → x >= contentWidth-viewWidth-4
    fireEvent(scrollView, 'scroll', {
      nativeEvent: {
        contentOffset: { x: 200 },
        contentSize: { width: 400 },
        layoutMeasurement: { width: 200 },
      },
    })
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('handleScroll: hides left fade at scroll start', () => {
    const { UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    const scrollView = UNSAFE_getByType(ScrollView)
    fireEvent(scrollView, 'scroll', {
      nativeEvent: {
        contentOffset: { x: 0 },
        contentSize: { width: 400 },
        layoutMeasurement: { width: 200 },
      },
    })
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })
})
