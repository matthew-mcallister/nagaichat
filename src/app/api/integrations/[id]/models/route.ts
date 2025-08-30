import { NextRequest, NextResponse } from 'next/server';
import { handleErrors } from '@/lib/error';
import { IntegrationTable } from '@/lib/integration'

export const GET = handleErrors(async function get(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const integrationId = Number(id);

  const models = await IntegrationTable.getModels(integrationId)

  return NextResponse.json(models);
})
