import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import express, { Request, Response } from 'express'
import cors from 'cors'

admin.initializeApp()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

export const api = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 60 },
  app,
)
