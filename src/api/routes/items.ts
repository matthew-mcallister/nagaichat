import getDb from '@/lib/backend/database'
import { createItem } from '@/lib/backend/helper'
import { Item } from '@/lib/backend/item'
import {
  addStreamListener,
  cancelStream,
  startStream,
} from '@/lib/backend/stream'
import { ValidationError } from '@/lib/error'
import { ContentObject, CreateItemRequest } from '@/lib/frontend/shared'
import { parseInteger, withTransaction } from '@/lib/util'
import { Router } from 'express'

const router = Router()

router.get('/', async (req, res) => {
  const sessionId = req.query.sessionId
  if (!sessionId) {
    throw new ValidationError('sessionId is required')
  }
  const items = await Item.getBySession(parseInteger(sessionId as string))
  res.json(items.map(item => item.toApiJson()))
})

router.post('/', async (req, res) => {
  const body: CreateItemRequest = req.body
  const item = await withTransaction(transaction =>
    createItem(body, transaction, true),
  )
  if (!body.content && body.role === 'model') {
    await startStream(body.options.modelOptions, item.id)
  }
  res.json(item.toApiJson())
})

router.patch('/:id', async (req, res) => {
  const body: { content?: ContentObject[] } = req.body

  if (!body.content) {
    throw new ValidationError('content field is required')
  }

  const transaction = await (await getDb()).transaction()
  const item = await Item.getById(
    parseInteger(req.params.id as string),
    transaction,
  )
  item.updateContent(body.content)
  await item.doReload(transaction)
  await transaction.commit()

  res.json(item.toApiJson())
})

// Returns an SSE stream of type Content[]
router.get('/:id/stream', (req, res) => {
  const id = parseInteger(req.params.id as string)

  let pendingVersion: any = null
  let queuedVersion = 0
  let consumedVersion = 0
  let listenerClosed = false
  let responseClosed = false
  let intervalId: ReturnType<typeof setInterval> | undefined = undefined

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const closeResponse = () => {
    if (responseClosed) {
      return
    }
    responseClosed = true
    if (intervalId) {
      clearInterval(intervalId)
    }
    res.write('event: close\ndata: null\n\n')
    res.end()
  }

  const flushPendingUpdate = () => {
    if (responseClosed || queuedVersion <= consumedVersion || !pendingVersion) {
      return
    }

    consumedVersion = queuedVersion
    res.write(
      `event: update\ndata: ${JSON.stringify(pendingVersion.content)}\n\n`,
    )
  }

  intervalId = setInterval(() => {
    flushPendingUpdate()
    if (listenerClosed && queuedVersion <= consumedVersion) {
      closeResponse()
    }
  }, 20)

  // Handle client disconnect
  req.on('close', () => {
    listenerClosed = true
  })

  addStreamListener(id, {
    onUpdate(data) {
      pendingVersion = data
      queuedVersion += 1
    },
    onClose() {
      listenerClosed = true
    },
  })
})

router.delete('/:id/stream', (req, res) => {
  cancelStream(parseInteger(req.params.id as string))
  res.status(204).send()
})

export default router
