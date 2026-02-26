import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { onAuthStateChanged } from 'firebase/auth'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { AppState, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import { firebaseAuth } from '@/lib/firebase'
import i18n from '@/lib/i18n'
import { useAuthStore } from '@/stores/useAuthStore'
import { tamaguiConfig } from '@/ui/tamagui.config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
      refetchOnMount: true,
    },
    mutations: { retry: 0 },
  },
})

const interFontFaces = {
  Inter: require('@tamagui/font-inter/otf/Inter-Regular.otf'),
  InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
} as const

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [fontsLoaded] = useFonts(interFontFaces)
  const uid = useAuthStore(s => s.uid)
  const setUid = useAuthStore(s => s.setUid)
  const segments = useSegments()
  const router = useRouter()
  const [isAuthReady, setIsAuthReady] = useState(false)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      focusManager.setFocused(state === 'active')
    })

    return () => {
      subscription.remove()
    }
  }, [])

  // Rehydrate uid from persisted Firebase Auth session on app reload
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, user => {
      setUid(user?.uid ?? null)
      setIsAuthReady(true)
    })
    return unsubscribe
  }, [])

  // Route guard: redirect unauthenticated users to login, authenticated users away from auth pages
  useEffect(() => {
    if (!isAuthReady) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!uid && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (uid && inAuthGroup) {
      router.replace('/(app)/')
    }
  }, [uid, segments, isAuthReady])

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TamaguiProvider
            config={tamaguiConfig}
            defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}
          >
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </TamaguiProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
