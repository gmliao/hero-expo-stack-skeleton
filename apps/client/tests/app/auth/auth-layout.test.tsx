import { render } from '@testing-library/react-native'
import AuthLayout from '../../../app/(auth)/_layout'

describe('AuthLayout', () => {
  it('renders without crashing', () => {
    expect(() => render(<AuthLayout />)).not.toThrow()
  })
})
