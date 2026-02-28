import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import express, { Request, RequestHandler, Response } from 'express'
import cors from 'cors'
import { createRequireAuth } from './middleware/auth'
import { exceptionMiddleware } from './middleware/error'
import { preflightMiddleware } from './middleware/preflight'
import { validateBody } from './lib/validate'
import { createTodoSchema, updateTodoSchema } from './schemas/todos.schema'
import { createTodoHandlers } from './handlers/todos'
import { FirebaseAuthVerifier } from './services/auth.firebase.service'
import { TodosFirestoreRepository } from './repositories/todos.firestore.repository'

admin.initializeApp()

const authVerifier = new FirebaseAuthVerifier()
const todosRepo = new TodosFirestoreRepository()
const requireAuth = createRequireAuth(authVerifier)
const todoHandlers = createTodoHandlers(todosRepo)

const app = express()

app.use(preflightMiddleware)

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
)
app.use(express.json())

app.use(requireAuth)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.get('/todos', todoHandlers.getTodos)
app.post('/todos', validateBody(createTodoSchema), todoHandlers.createTodo as unknown as RequestHandler)
app.patch('/todos/:id/toggle', todoHandlers.toggleTodo)
app.patch('/todos/:id', validateBody(updateTodoSchema), todoHandlers.updateTodo as unknown as RequestHandler)
app.delete('/todos/:id', todoHandlers.deleteTodo)

app.use(exceptionMiddleware)

export const api = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 60 },
  app,
)
