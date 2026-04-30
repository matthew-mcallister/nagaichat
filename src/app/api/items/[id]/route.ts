import getDb from '@/lib/backend/database'
import { Item } from '@/lib/backend/item'
import { handleErrors, ValidationError } from '@/lib/error'
import { ContentObject } from '@/lib/frontend/shared'
import { parseInteger } from '@/lib/util'
import { NextRequest, NextResponse } from 'next/server'

interface UpdateItemRequest {
  content: ContentObject[]
}

export const PATCH = handleErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const body: UpdateItemRequest = await request.json()

    if (!body.content) {
      throw new ValidationError('content field is required')
    }

    const transaction = await (await getDb()).transaction()
    const item = await Item.getById(parseInteger(params.id), transaction)
    item.updateContent(body.content)
    await item.doReload(transaction)
    await transaction.commit()

    return NextResponse.json(item.toApiJson())
  },
)
