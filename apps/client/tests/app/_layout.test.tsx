import { Alert } from 'react-native'
import { handleMutationError } from '@/lib/mutationError'
import { ApiError, AuthError, PermissionError } from '@/data/api'
import i18n from '@/lib/i18n'

const mockTranslations = {
  en: {
    'common.errorTitle': 'Error',
    'common.unknownError': 'Unknown error',
  },
  'zh-TW': {
    'common.errorTitle': '錯誤',
    'common.unknownError': '未知錯誤',
  },
} as const

let mockCurrentLanguage: keyof typeof mockTranslations = 'en'

jest.mock('@/lib/i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: jest.fn(async (language: keyof typeof mockTranslations) => {
      mockCurrentLanguage = language
    }),
    t: jest.fn((key: keyof (typeof mockTranslations)['en']) => {
      return mockTranslations[mockCurrentLanguage][key] ?? key
    }),
  },
}))

jest.spyOn(Alert, 'alert').mockImplementation(() => {})

describe('handleMutationError', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await i18n.changeLanguage('en')
  })

  it('uses localized title and message in English', () => {
    handleMutationError(new Error('Server is down'))
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Server is down')
  })

  it('uses localized fallback message for non-Error values', () => {
    handleMutationError('string error')
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Unknown error')
  })

  it('uses localized fallback message for null', () => {
    handleMutationError(null)
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Unknown error')
  })

  it('uses translated strings for zh-TW locale', async () => {
    await i18n.changeLanguage('zh-TW')

    handleMutationError(null)

    expect(Alert.alert).toHaveBeenCalledWith('錯誤', '未知錯誤')
  })

  it('uses ApiError message', () => {
    handleMutationError(new ApiError('Not Found', 404))
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Not Found')
  })

  it('uses AuthError message', () => {
    handleMutationError(new AuthError('Session expired', 401))
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Session expired')
  })

  it('uses PermissionError message', () => {
    handleMutationError(new PermissionError('Access denied', 403))
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Access denied')
  })

  it('calls Alert exactly once per invocation', () => {
    handleMutationError(new Error('once'))
    expect(Alert.alert).toHaveBeenCalledTimes(1)
  })
})
