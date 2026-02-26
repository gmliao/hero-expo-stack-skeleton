import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { requireAuth } from './middleware/auth'
import { getTodos, createTodo, toggleTodo } from './handlers/todos'

admin.initializeApp()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.get('/health', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.get('/todos', requireAuth, getTodos)
app.post('/todos', requireAuth, createTodo)
app.patch('/todos/:id/toggle', requireAuth, toggleTodo)

export const api = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 60 },
  app,
)
