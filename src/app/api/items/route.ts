import { NextRequest, NextResponse } from 'next/server'
import { handleErrors, ValidationError } from '@/lib/error'
import { parseInteger } from '@/lib/util'
import { Item } from '@/lib/backend/item'

export const GET = handleErrors(async (request: NextRequest) => {
  const query = request.nextUrl.searchParams
  const sessionId = query.get('sessionId')
  if (!sessionId) {
    throw new ValidationError('sessionId is required')
  }
  const items = await Item.getBySession(parseInteger(sessionId))
  return NextResponse.json(items)
})
