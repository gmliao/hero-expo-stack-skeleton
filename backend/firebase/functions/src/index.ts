import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { createRequireAuth } from './middleware/auth'
import { createTodoHandlers } from './handlers/todos'
import { FirebaseAuthVerifier } from './services/auth.firebase.service'
import { TodosFirestoreRepository } from './repositories/todos.firestore.repository'

admin.initializeApp()

const authVerifier = new FirebaseAuthVerifier()
const todosRepo = new TodosFirestoreRepository()
const requireAuth = createRequireAuth(authVerifier)
const todoHandlers = createTodoHandlers(todosRepo)

const app = express()
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
)
app.use(express.json())
app.options('*', (_req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.sendStatus(204)
})

app.get('/health', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.get('/todos', requireAuth, todoHandlers.getTodos)
app.post('/todos', requireAuth, todoHandlers.createTodo)
app.patch('/todos/:id/toggle', requireAuth, todoHandlers.toggleTodo)
app.patch('/todos/:id', requireAuth, todoHandlers.updateTodo)
app.delete('/todos/:id', requireAuth, todoHandlers.deleteTodo)

export const api = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 60 },
  app,
)
