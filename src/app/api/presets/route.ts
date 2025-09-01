import { NextRequest, NextResponse } from 'next/server'
import { handleErrors } from '@/lib/error'
import { Preset } from '@/lib/backend/preset'
import { CreatePresetRequest } from '@/lib/frontend/api'

export const GET = handleErrors(async () => {
  const presets = await Preset.findAll({
    order: [['createdAt', 'DESC']]
  })
  const result = presets.map(preset => preset.toApiJson())
  return NextResponse.json(result)
})

export const POST = handleErrors(async (request: NextRequest) => {
  const body: CreatePresetRequest = await request.json()
  const preset = await Preset.create(body as any)
  return NextResponse.json(preset.toApiJson(), { status: 201 })
})
