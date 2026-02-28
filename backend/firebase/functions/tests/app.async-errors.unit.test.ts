import express from 'express'
import request from 'supertest'
import { exceptionMiddleware } from '../src/middleware/error'

describe('app async errors (unit)', () => {
  it('returns 500 and FailureDto when async route throws', async () => {
    const app = express()
    app.use(express.json())
    app.get('/boom', async () => {
      throw new Error('db')
    })
    app.use(exceptionMiddleware)

    const res = await request(app).get('/boom')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({
      success: false,
      error: 'Internal server error',
    })
  })
})
