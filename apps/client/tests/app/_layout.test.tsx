import { Alert } from 'react-native'
import { handleMutationError } from '@/lib/mutationError'
import { ApiError, AuthError, PermissionError } from '@/data/api'

jest.spyOn(Alert, 'alert').mockImplementation(() => {})

describe('handleMutationError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls Alert.alert with Error message', () => {
    handleMutationError(new Error('Server is down'))
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Server is down')
  })

  it('calls Alert.alert with "Unknown error" for non-Error values', () => {
    handleMutationError('string error')
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Unknown error')
  })

  it('calls Alert.alert with "Unknown error" for null', () => {
    handleMutationError(null)
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Unknown error')
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
