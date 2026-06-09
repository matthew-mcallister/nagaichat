import { Router } from 'express'
import { Preset } from '@/lib/backend/preset'
import { parseInteger } from '@/lib/util'
import { CreatePresetRequest, UpdatePresetRequest } from '@/lib/frontend/shared'

const router = Router()

router.get('/', async (_req, res) => {
  const presets = await Preset.findAll({
    order: [['createdAt', 'DESC']],
  })
  res.json(presets.map(preset => preset.toApiJson()))
})

router.post('/', async (req, res) => {
  const body: CreatePresetRequest = req.body
  const preset = await Preset.create(body as any)
  res.status(201).json(preset.toApiJson())
})

router.patch('/:id', async (req, res) => {
  const body: UpdatePresetRequest = req.body
  const preset = await Preset.getById(parseInteger(req.params.id as string))
  await preset.update(body as any)
  res.status(200).json(preset.toApiJson())
})

router.delete('/:id', async (req, res) => {
  const preset = await Preset.getById(parseInteger(req.params.id as string))
  await preset.destroy()
  res.status(204).send()
})

export default router
