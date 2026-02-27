import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from '@/i18n/en'
import { zhTW } from '@/i18n/zh-TW'

const traditionalChineseTags = new Set([
  'zh-tw',
  'zh-hk',
  'zh-mo',
  'zh-hant',
  'zh-hant-tw',
  'zh-hant-hk',
  'zh-hant-mo',
])

const normalizeLanguageTag = (languageTag: string): string =>
  languageTag.trim().toLowerCase().replace(/_/g, '-')

const resolveLanguage = (languageTag: string): 'en' | 'zh-TW' => {
  const normalizedTag = normalizeLanguageTag(languageTag)
  return traditionalChineseTags.has(normalizedTag) ? 'zh-TW' : 'en'
}

const languageTag = getLocales()[0]?.languageTag ?? 'en'
const normalizedLanguage = resolveLanguage(languageTag)

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: normalizedLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'zh-TW'],
  nonExplicitSupportedLngs: true,
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: en },
    'zh-TW': { translation: zhTW },
  },
})

export default i18n
