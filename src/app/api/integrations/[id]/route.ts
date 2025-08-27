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

export const PUT = handleErrors(async function put(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: UpdateIntegrationRequest = await request.json();

  const integration = IntegrationTable.update(Number(id), body);

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
  const deleted = IntegrationTable.delete(id);

  if (!deleted) {
    throw new NoSuchResource('Integration not found');
  }

  return NextResponse.json({ success: true });
})
