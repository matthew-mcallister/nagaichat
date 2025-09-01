import { NextRequest, NextResponse } from 'next/server'
import { handleErrors, ValidationError } from '@/lib/error'
import { Integration } from '@/lib/backend/integration'
import { CreateIntegrationRequest } from '@/lib/frontend/api'

// @ts-ignore
@handleErrors
export async function GET() {
  const integrations = (await Integration.getAll())
    .map(int => int.toApiJson())
  return NextResponse.json(integrations)
}

// @ts-ignore
@handleErrors
export async function POST(request: NextRequest) {
  const body: CreateIntegrationRequest = await request.json()

  // Basic validation
  if (!body.name || !body.interface || !body.apiKey) {
    throw new ValidationError('Name, interface, and apiKey are required')
  }

  if (!['openai', 'gemini'].includes(body.interface)) {
    throw new ValidationError('interface must be either "openai" or "gemini"')
  }

  // @ts-ignore
  const integration = await Integration.create(body)
  return NextResponse.json(integration.toApiJson(), { status: 201 })
}
