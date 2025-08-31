import { NextRequest, NextResponse } from 'next/server'
import { handleErrors, ValidationError } from '@/lib/error'
import { Integration } from '@/lib/backend/integration'
import { CreateIntegrationRequest } from '@/lib/frontend/api'

export const GET = handleErrors(async function get() {
  const integrations = (await Integration.getAll())
    .map(int => int.toApiJson())
  return NextResponse.json(integrations)
})

export const POST = handleErrors(async function post(request: NextRequest) {
  const body: CreateIntegrationRequest = await request.json()

  // Basic validation
  if (!body.name || !body.interface || !body.apiKey) {
    throw new ValidationError('Name, interface, and apiKey are required')
  }

  if (!['openai', 'gemini'].includes(body.interface)) {
    throw new ValidationError('interface must be either "openai" or "gemini"')
  }

  const integration = await Integration.create(body)
  return NextResponse.json(integration.toApiJson(), { status: 201 })
})
