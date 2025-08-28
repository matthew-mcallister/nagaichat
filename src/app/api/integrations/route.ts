import { NextRequest, NextResponse } from 'next/server';
import { IntegrationTable, CreateIntegrationRequest } from '@/lib/integration';
import { handleErrors, ValidationError } from '@/lib/error';

export const GET = handleErrors(async function get() {
  const integrations = IntegrationTable.getAll();
  return NextResponse.json(integrations);
})

export const POST = handleErrors(async function post(request: NextRequest) {
  const body: CreateIntegrationRequest = await request.json();

  // Basic validation
  if (!body.name || !body.interface || !body.apiKey) {
    throw new ValidationError('Name, interface, and apiKey are required');
  }

  if (!['openai', 'gemini'].includes(body.interface)) {
    throw new ValidationError('interface must be either "openai" or "gemini"');
  }

  const integration = IntegrationTable.create(body);
  return NextResponse.json(integration, { status: 201 });
})
