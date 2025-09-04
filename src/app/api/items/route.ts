import { NextRequest, NextResponse } from 'next/server'
import { handleErrors } from '@/lib/error'
import { parseInteger } from '@/lib/util'
import { Item } from '@/lib/backend/item'

export const GET = handleErrors(async (
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  const { sessionId } = await params
  const items = await Item.getBySession(parseInteger(sessionId))
  return NextResponse.json(items)
})
