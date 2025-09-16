import { NextRequest, NextResponse } from 'next/server'
import { handleErrors, ValidationError } from '@/lib/error'
import { Item } from '@/lib/backend/item'
import { parseInteger } from '@/lib/util'
import { ContentObject } from '@/lib/frontend/api'
import { Content } from '@/lib/backend/content'
import getDb from '@/lib/backend/database'

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

  const transaction = await (await getDb()).transaction()
  const item = await Item.getById(parseInteger(params.id), transaction)
  // Delete old content
  Content.destroy({ where: { itemId: item.id }, transaction })
  // Create new content
  for (const content of body.content) {
    Content.createFromApiJson(item, content, transaction)
  }
  await item.doReload(transaction)
  await transaction.commit()

  return NextResponse.json(item.toApiJson())
})
