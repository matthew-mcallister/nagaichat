import { Integration } from '@/lib/backend/integration'
import { handleErrors, ValidationError } from '@/lib/error'
import { CreateIntegrationRequest, INTERFACES } from '@/lib/frontend/api'
import { NextRequest, NextResponse } from 'next/server'

export const GET = handleErrors(async () => {
  const integrations = (await Integration.getAll()).map(int => int.toApiJson())
  return NextResponse.json(integrations)
})

export const POST = handleErrors(async (request: NextRequest) => {
  const body: CreateIntegrationRequest = await request.json()

  // Basic validation
  if (!body.name || !body.interface || !body.apiKey) {
    throw new ValidationError('Name, interface, and apiKey are required')
  }

  if (!INTERFACES.includes(body.interface)) {
    throw new ValidationError(
      'interface must be one of ' + INTERFACES.join(', '),
    )
  }

  const integration = await Integration.create(body as any)
  return NextResponse.json(integration.toApiJson(), { status: 201 })
})
