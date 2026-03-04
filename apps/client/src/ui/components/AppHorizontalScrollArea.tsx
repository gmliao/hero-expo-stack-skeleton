import { useMemo, useRef, useState } from 'react'
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler'
import { cn } from '@/ui/utils/cn'

interface AppHorizontalScrollAreaProps {
  children: React.ReactNode
  gap?: number
  className?: string
  contentStyle?: StyleProp<ViewStyle>
}

export function AppHorizontalScrollArea({
  children,
  gap = 8,
  className,
  contentStyle,
}: AppHorizontalScrollAreaProps) {
  const scrollRef = useRef<ScrollView>(null)
  const scrollXRef = useRef(0)
  const startScrollXRef = useRef(0)
  const containerWidthRef = useRef(0)
  const contentWidthRef = useRef(0)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  const isWeb = Platform.OS === 'web'

  const pan = useMemo(
    () =>
      isWeb
        ? Gesture.Pan()
            .runOnJS(true)
            .activeOffsetX([-4, 4])
            .failOffsetY([-8, 8])
            .onBegin(() => {
              startScrollXRef.current = scrollXRef.current
            })
            .onUpdate(e => {
              const newX = Math.max(0, startScrollXRef.current - e.translationX)
              scrollRef.current?.scrollTo({ x: newX, animated: false })
            })
        : Gesture.Pan(),
    [isWeb],
  )

  function handleLayout(e: { nativeEvent: { layout: { width: number } } }) {
    const viewWidth = e.nativeEvent.layout.width
    containerWidthRef.current = viewWidth
    setShowRightFade(contentWidthRef.current > viewWidth + 4)
  }

  function handleScroll(e: {
    nativeEvent: {
      contentOffset: { x: number }
      contentSize: { width: number }
      layoutMeasurement: { width: number }
    }
  }) {
    const x = e.nativeEvent.contentOffset.x
    const contentWidth = e.nativeEvent.contentSize.width
    const viewWidth = e.nativeEvent.layoutMeasurement.width
    scrollXRef.current = x
    containerWidthRef.current = viewWidth
    setShowLeftFade(x > 4)
    setShowRightFade(x < contentWidth - viewWidth - 4)
  }

  function handleContentSizeChange(contentWidth: number) {
    contentWidthRef.current = contentWidth
    setShowRightFade(contentWidth > containerWidthRef.current + 4)
  }

  const scrollView = (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={isWeb ? handleScroll : undefined}
      onContentSizeChange={isWeb ? handleContentSizeChange : undefined}
      scrollEventThrottle={isWeb ? 16 : 0}
      contentContainerStyle={[{ gap }, contentStyle as StyleProp<ViewStyle>]}
    >
      {children}
    </ScrollView>
  )

  if (!isWeb) {
    return <View className={cn('flex-1', className)}>{scrollView}</View>
  }

  return (
    <View className={cn('flex-1', className)} style={{ position: 'relative' }} onLayout={handleLayout}>
      <GestureDetector gesture={pan}>{scrollView}</GestureDetector>
      {showLeftFade && (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, top: 0, bottom: 0, width: 24 },
            // web-only CSS gradient; backgroundImage is not in RN ViewStyle
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.95), transparent)' } as any,
          ]}
        />
      )}
      {showRightFade && (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', right: 0, top: 0, bottom: 0, width: 24 },
            // web-only CSS gradient; backgroundImage is not in RN ViewStyle
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { backgroundImage: 'linear-gradient(to left, rgba(255,255,255,0.95), transparent)' } as any,
          ]}
        />
      )}
    </View>
  )
}
