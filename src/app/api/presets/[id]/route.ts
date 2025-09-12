import { NextRequest, NextResponse } from 'next/server'
import { handleErrors } from '@/lib/error'
import { Preset } from '@/lib/backend/preset'
import { parseInteger } from '@/lib/util'
import { UpdatePresetRequest } from '@/lib/frontend/api'

export const PATCH = handleErrors(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  params = await params
  const body: UpdatePresetRequest = await request.json()
  const preset = await Preset.getById(parseInteger(params.id))
  await preset.update(body as any)
  return NextResponse.json(preset.toApiJson() as any, { status: 200 })
})

export const DELETE = handleErrors(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessionOptions = await Preset.getById(parseInteger(params.id))
  await sessionOptions.destroy()
  return new NextResponse(null, { status: 204 })
})
