import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { requireAuth } from './middleware/auth'
import { getTodos, createTodo, toggleTodo, updateTodo, deleteTodo } from './handlers/todos'

admin.initializeApp()

const app = express()
// CORS: allow Expo web (localhost:8081 etc.) and preflight
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
)
app.use(express.json())
// Explicit OPTIONS for preflight (some runtimes don't pass OPTIONS to cors())
app.options('*', (_req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.sendStatus(204)
})

app.get('/health', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.get('/todos', requireAuth, getTodos)
app.post('/todos', requireAuth, createTodo)
app.patch('/todos/:id/toggle', requireAuth, toggleTodo)
app.patch('/todos/:id', requireAuth, updateTodo)
app.delete('/todos/:id', requireAuth, deleteTodo)

export const api = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 60 },
  app,
)
