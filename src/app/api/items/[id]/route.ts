import { NextRequest, NextResponse } from 'next/server'
import { handleErrors, ValidationError } from '@/lib/error'
import { Item } from '@/lib/backend/item'
import { parseInteger } from '@/lib/util'
import { ContentObject } from '@/lib/frontend/api'

interface UpdateItemRequest {
  content: ContentObject[]
}

export const PATCH = handleErrors(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const body: UpdateItemRequest = await request.json()

  if (!body.content) {
    throw new ValidationError('content field is required')
  }

  const item = await Item.getById(parseInteger(params.id))
  await item.update({ content: body.content })

  return NextResponse.json(item.toApiJson())
})
