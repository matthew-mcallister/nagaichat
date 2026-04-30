import { createItem } from '@/lib/backend/helper'
import { Item } from '@/lib/backend/item'
import { startStream } from '@/lib/backend/stream'
import { handleErrors, ValidationError } from '@/lib/error'
import { CreateItemRequest } from '@/lib/frontend/shared'
import { parseInteger, withTransaction } from '@/lib/util'
import { NextRequest, NextResponse } from 'next/server'

export const GET = handleErrors(async (request: NextRequest) => {
  const query = request.nextUrl.searchParams
  const sessionId = query.get('sessionId')
  if (!sessionId) {
    throw new ValidationError('sessionId is required')
  }
  const items = await Item.getBySession(parseInteger(sessionId))
  return NextResponse.json(items.map(item => item.toApiJson()))
})

export const POST = handleErrors(async (request: NextRequest) => {
  const body: CreateItemRequest = await request.json()
  const item = await withTransaction(transaction =>
    createItem(body, transaction, true, request.signal),
  )
  if (!body.content && body.role === 'model') {
    startStream(body.options.modelOptions, item.id)
  }
  return NextResponse.json(item.toApiJson())
})
