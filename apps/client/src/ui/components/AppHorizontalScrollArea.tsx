import { useMemo, useRef, useState, type CSSProperties } from 'react'
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

  // web-only: mask-image clips scroll content at edges without a colour overlay,
  // so the fade blends into any background regardless of colour token.
  const maskImage =
    showLeftFade && showRightFade
      ? 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)'
      : showLeftFade
        ? 'linear-gradient(to right, transparent, black 24px)'
        : showRightFade
          ? 'linear-gradient(to left, transparent, black 24px)'
          : undefined

  return (
    <View
      className={cn('flex-1', className)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={{ position: 'relative', ...(maskImage ? ({ maskImage, WebkitMaskImage: maskImage } as CSSProperties) : {}) } as any}
      onLayout={handleLayout}
    >
      <GestureDetector gesture={pan}>{scrollView}</GestureDetector>
    </View>
  )
}
