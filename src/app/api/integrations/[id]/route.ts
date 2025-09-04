import { NextRequest, NextResponse } from 'next/server'
import { handleErrors } from '@/lib/error'
import { Integration } from '@/lib/backend/integration'
import { UpdateIntegrationRequest } from '@/lib/frontend/api'
import { parseInteger } from '@/lib/util'

export const GET = handleErrors(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const integration = await Integration.getById(parseInteger(id))
  return NextResponse.json(integration.toApiJson())
})

export const PATCH = handleErrors(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body: UpdateIntegrationRequest = await request.json()

  if (!body.apiKey) {
    body.apiKey = undefined
  }

  const integration = await Integration.getById(parseInteger(id))
  await integration.doUpdate(body)

  return NextResponse.json(integration.toApiJson())
})

export const DELETE = handleErrors(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const integration = await Integration.getById(parseInteger(id))
  integration.destroy()

  return new NextResponse(null, { status: 200 })
})
