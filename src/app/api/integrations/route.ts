import { NextRequest, NextResponse } from 'next/server';
import { IntegrationTable, CreateIntegrationRequest } from '@/lib/integration';
import { handleErrors, InvalidRequest } from '@/lib/error';

export const GET = handleErrors(async function get() {
  const integrations = IntegrationTable.getAll();
  return NextResponse.json(integrations);
})

export const POST = handleErrors(async function post(request: NextRequest) {
  const body: CreateIntegrationRequest = await request.json();

  // Basic validation
  if (!body.name || !body.provider || !body.apiKey) {
    throw new InvalidRequest('Name, provider, and apiKey are required');
  }

  if (!['openai', 'gemini'].includes(body.provider)) {
    throw new InvalidRequest('Provider must be either "openai" or "gemini"');
  }

  const integration = IntegrationTable.create(body);
  return NextResponse.json(integration, { status: 201 });
})
