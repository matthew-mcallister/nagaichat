import { Item } from '@/lib/backend/item'
import { Session } from '@/lib/backend/session'
import { ValidationError } from '@/lib/error'
import { CreateItemRequest } from '@/lib/frontend/shared'
import { Transaction } from 'sequelize'

export async function createItem(
  body: CreateItemRequest,
  transaction: Transaction,
): Promise<Item> {
  const session = await Session.getById(body.sessionId, transaction)

  const parent = body.parentId
    ? await Item.getById(body.parentId, transaction)
    : null

  await session.update(
    { options: body.options, presetId: body.presetId },
    { transaction },
  )

  let item: Item
  if (body.content !== null) {
    // Create the item
    item = await Item.doCreate({
      sessionId: session.id,
      parentId: parent?.id,
      content: body.content,
      role: body.role,
      transaction,
    })
  } else {
    if (!parent || parent.role === 'model') {
      throw new ValidationError('Role must be "user"')
    }

    // Create an empty item for the model to stream into
    item = await Item.doCreate({
      sessionId: parent.sessionId,
      parentId: parent.id,
      role: 'model',
      content: [],
      transaction,
    })
  }

  session.latestItemId = item.id
  await session.save({ transaction })

  return item
}
