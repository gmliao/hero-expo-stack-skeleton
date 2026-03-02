const mockAuthInstance = { verifyIdToken: jest.fn() }
const mockRepoInstance = { kind: 'repo' }
const mockServiceInstance = { kind: 'service' }

jest.mock('../../src/infrastructure/auth/auth.firebase.service', () => ({
  FirebaseAuthVerifier: jest.fn().mockImplementation(() => mockAuthInstance),
}))

jest.mock('../../src/modules/todos/todos.firestore.repository', () => ({
  TodosFirestoreRepository: jest.fn().mockImplementation(() => mockRepoInstance),
}))

jest.mock('../../src/modules/todos/todos.service', () => ({
  TodosService: jest.fn().mockImplementation(() => mockServiceInstance),
}))

import { createDeps } from '../../src/core/deps'
import { FirebaseAuthVerifier } from '../../src/infrastructure/auth/auth.firebase.service'
import { TodosFirestoreRepository } from '../../src/modules/todos/todos.firestore.repository'
import { TodosService } from '../../src/modules/todos/todos.service'

describe('createDeps (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('wires repository, service, auth verifier, and logger', () => {
    const deps = createDeps()

    expect(TodosFirestoreRepository).toHaveBeenCalledTimes(1)
    expect(TodosService).toHaveBeenCalledWith(mockRepoInstance, deps.services.tags)
    expect(FirebaseAuthVerifier).toHaveBeenCalledTimes(1)
    expect(deps.services.todos).toBe(mockServiceInstance)
    expect(deps.auth).toBe(mockAuthInstance)
    expect(typeof deps.logger.info).toBe('function')
    expect(typeof deps.logger.warn).toBe('function')
    expect(typeof deps.logger.error).toBe('function')
  })

  it('logger delegates to console methods', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const deps = createDeps()
    deps.logger.info('info-msg', { ok: true })
    deps.logger.warn('warn-msg')
    deps.logger.error('error-msg', { failed: true })

    expect(logSpy).toHaveBeenCalledWith('info-msg', { ok: true })
    expect(warnSpy).toHaveBeenCalledWith('warn-msg', '')
    expect(errorSpy).toHaveBeenCalledWith('error-msg', { failed: true })

    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
