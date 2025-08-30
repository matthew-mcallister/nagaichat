import { NextRequest, NextResponse } from 'next/server';
import { IntegrationTable } from '@/lib/integration';
import { handleErrors, NoSuchResource } from '@/lib/error';
import { getApi } from '@/lib/integrations/interface'

export const GET = handleErrors(async function get(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const integration = IntegrationTable.getSensitive(Number(id));
  if (!integration) {
    throw new NoSuchResource('Integration not found');
  }

  const api = getApi(integration)
  const models = await api.getModels()

  return NextResponse.json(models);
})
