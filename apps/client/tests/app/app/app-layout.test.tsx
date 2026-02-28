import { render } from '@testing-library/react-native'
import AppLayout from '../../../app/(app)/_layout'

describe('AppLayout', () => {
  it('renders without crashing', () => {
    expect(() => render(<AppLayout />)).not.toThrow()
  })
})
