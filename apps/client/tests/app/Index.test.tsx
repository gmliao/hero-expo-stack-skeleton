import { render } from '@testing-library/react-native'
import Index from '../../app/index'

describe('app/index (root)', () => {
  it('renders without crashing (Redirect to (app))', () => {
    expect(() => render(<Index />)).not.toThrow()
  })
})
