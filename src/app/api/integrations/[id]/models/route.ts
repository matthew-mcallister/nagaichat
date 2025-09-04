import { NextRequest, NextResponse } from 'next/server'
import { handleErrors } from '@/lib/error'
import { Integration } from '@/lib/backend/integration'
import { parseInteger } from '@/lib/util'

export const GET = handleErrors(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const integration = await Integration.getById(parseInteger(id))

  const models = await integration.models()

  return NextResponse.json(models)
})
