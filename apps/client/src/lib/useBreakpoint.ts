import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const TABLET_MAX = 1023

/**
 * Returns current breakpoint based on window width.
 * - mobile: width < 768
 * - tablet: 768 ≤ width < 1024
 * - desktop: width ≥ 1024
 */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions()
  return useMemo(() => {
    if (width < 768) return 'mobile'
    if (width <= TABLET_MAX) return 'tablet'
    return 'desktop'
  }, [width])
}
