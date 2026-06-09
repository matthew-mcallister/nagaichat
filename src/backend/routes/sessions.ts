import { Router } from 'express'
import { Session } from '@/lib/backend/session'
import { parseInteger, withTransaction } from '@/lib/util'
import { CreateSessionRequest } from '@/lib/frontend/shared'

const router = Router()

router.get('/', async (_req, res) => {
  const sessions = await Session.getAll()
  res.json(sessions.map(session => session.toApiJson()))
})

router.post('/', async (req, res) => {
  const body: CreateSessionRequest = req.body
  const session = await withTransaction(transaction =>
    Session.doCreate(body, transaction),
  )
  res.status(201).json(session.toApiJson())
})

router.get('/:id', async (req, res) => {
  const id = parseInteger(req.params.id as string)
  const session = await Session.getById(id)
  res.json(session.toApiJson())
})

router.delete('/:id', async (req, res) => {
  const id = parseInteger(req.params.id as string)
  const session = await Session.getById(id)
  await session.destroy()
  res.status(204).send()
})

export default router
