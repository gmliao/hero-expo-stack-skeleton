import '../global.css'

import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { onAuthStateChanged } from 'firebase/auth'
import {
  NunitoSans_400Regular,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans'
import { VarelaRound_400Regular } from '@expo-google-fonts/varela-round'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { Alert, AppState } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { firebaseAuth } from '@/lib/firebase'
import i18n from '@/lib/i18n'
import { useAuthStore } from '@/stores/useAuthStore'
import { GluestackUIProvider } from '@/ui/gluestack-provider'

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
    mutations: {
      retry: 0,
      onError: (error: Error) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error'
        Alert.alert('Error', message)
      },
    },
  },
})

const fontFaces = {
  'Varela Round': VarelaRound_400Regular,
  'Nunito Sans': NunitoSans_400Regular,
  'Nunito Sans Bold': NunitoSans_700Bold,
} as const

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontFaces)
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, user => {
      setUid(user?.uid ?? null)
      setIsAuthReady(true)
    })
    return unsubscribe
  }, [setUid])

  useEffect(() => {
    if (!isAuthReady) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!uid && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (uid && inAuthGroup) {
      router.replace('/(app)')
    }
  }, [uid, segments, isAuthReady, router])

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <GluestackUIProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </GluestackUIProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
