import { Router } from 'express'
import { Integration } from '@/lib/backend/integration'
import { ValidationError } from '@/lib/error'
import { parseInteger } from '@/lib/util'
import {
  CreateIntegrationRequest,
  INTERFACES,
  UpdateIntegrationRequest,
} from '@/lib/frontend/shared'

const router = Router()

router.get('/', async (_req, res) => {
  const integrations = await Integration.getAll()
  res.json(integrations.map(int => int.toApiJson()))
})

router.post('/', async (req, res) => {
  const body: CreateIntegrationRequest = req.body

  if (!body.name || !body.interface || !body.apiKey) {
    throw new ValidationError('Name, interface, and apiKey are required')
  }

  if (!INTERFACES.includes(body.interface)) {
    throw new ValidationError(
      'interface must be one of ' + INTERFACES.join(', '),
    )
  }

  const integration = await Integration.create(body as any)
  res.status(201).json(integration.toApiJson())
})

router.get('/:id', async (req, res) => {
  const integration = await Integration.getById(parseInteger(req.params.id as string))
  res.json(integration.toApiJson())
})

router.patch('/:id', async (req, res) => {
  console.log('PATCH /api/integrations/:id hit', req.params.id, req.body)
  const body: UpdateIntegrationRequest = req.body

  if (!body.apiKey) {
    body.apiKey = undefined
  }

  const integration = await Integration.getById(parseInteger(req.params.id as string))
  try {
    await integration.doUpdate(body)
  } catch (e) {
    console.error('PATCH error:', e)
    throw e
  }

  res.json(integration.toApiJson())
})

router.delete('/:id', async (req, res) => {
  const integration = await Integration.getById(parseInteger(req.params.id as string))
  integration.destroy()

  res.status(200).send()
})

router.get('/:id/models', async (req, res) => {
  const integration = await Integration.getById(parseInteger(req.params.id as string))
  const models = await integration.models()
  res.json(models)
})

export default router
