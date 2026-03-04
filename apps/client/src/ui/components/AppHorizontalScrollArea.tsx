import { useRef, useState } from 'react'
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
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  const isWeb = Platform.OS === 'web'

  const pan = Gesture.Pan()
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
    setShowRightFade(contentWidth > containerWidthRef.current + 4)
  }

  const scrollView = (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={isWeb ? handleScroll : undefined}
      onContentSizeChange={isWeb ? handleContentSizeChange : undefined}
      scrollEventThrottle={16}
      contentContainerStyle={[{ gap }, contentStyle as StyleProp<ViewStyle>]}
    >
      {children}
    </ScrollView>
  )

  if (!isWeb) {
    return <View className={cn('flex-1', className)}>{scrollView}</View>
  }

  return (
    <View className={cn('flex-1', className)} style={{ position: 'relative' }}>
      <GestureDetector gesture={pan}>{scrollView}</GestureDetector>
      {showLeftFade && (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, top: 0, bottom: 0, width: 24 },
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { backgroundImage: 'linear-gradient(to left, rgba(255,255,255,0.95), transparent)' } as any,
          ]}
        />
      )}
    </View>
  )
}
