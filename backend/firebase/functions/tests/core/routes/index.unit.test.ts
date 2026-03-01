const mockMount = jest.fn()

jest.mock('../../../src/modules/todos/todos.controller', () => ({
  TodosController: jest.fn().mockImplementation(() => ({
    mount: mockMount,
  })),
}))

import { registerControllers } from '../../../src/core/routes'
import { TodosController } from '../../../src/modules/todos/todos.controller'

describe('registerControllers (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('instantiates TodosController and mounts it on the builder', () => {
    const builder = { add: jest.fn(), mount: jest.fn() } as any

    registerControllers(builder)

    expect(TodosController).toHaveBeenCalledTimes(1)
    expect(mockMount).toHaveBeenCalledWith(builder)
  })
})
