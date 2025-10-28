import { Integration } from '@/lib/backend/integration'
import { ApiConnector } from '@/lib/backend/integrations/interface'
import { Item } from '@/lib/backend/item'
import { Session } from '@/lib/backend/session'
import { ValidationError } from '@/lib/error'
import { CreateItemRequest } from '@/lib/frontend/api'
import { Transaction } from 'sequelize'

export async function createItem(
  body: CreateItemRequest,
  transaction: Transaction,
  signal?: AbortSignal,
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
  if (body.role == 'user') {
    if (parent && parent.role === 'user') {
      throw new ValidationError('Role must be "model"')
    }
  }

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

    // Generate a response
    const options = body.options.modelOptions
    const integration = await Integration.getById(
      options.integration,
      transaction,
    )
    const api = new ApiConnector(integration)
    item = await api.generate(parent, transaction, signal)
  }

  session.latestItemId = item.id
  await session.save({ transaction })

  return item
}
