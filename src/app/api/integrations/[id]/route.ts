import { NextRequest, NextResponse } from 'next/server';
import { IntegrationTable, UpdateIntegrationRequest } from '@/lib/integration';
import { handleErrors, NoSuchResource } from '@/lib/error';

export const GET = handleErrors(async function get(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const integration = IntegrationTable.getById(Number(id));

  if (!integration) {
    throw new NoSuchResource('Integration not found');
  }

  return NextResponse.json(integration);
})

export const PATCH = handleErrors(async function put(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const integrationId = Number(id);
  const body: UpdateIntegrationRequest = await request.json();

  if (!body.apiKey) {
    body.apiKey = undefined
  }

  const integration = IntegrationTable.update(integrationId, body);

  if (!integration) {
    throw new NoSuchResource('Integration not found');
  }

  return NextResponse.json(integration);
})

export const DELETE = handleErrors(async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const integrationId = Number(id);

  const deleted = IntegrationTable.delete(integrationId);

  if (!deleted) {
    throw new NoSuchResource('Integration not found');
  }

  return new NextResponse(null, { status: 200 });
})
