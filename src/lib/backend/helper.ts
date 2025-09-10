import getDb from "@/lib/backend/database"
import { Integration } from "@/lib/backend/integration"
import { ApiConnector } from "@/lib/backend/integrations/interface"
import { Item } from "@/lib/backend/item"
import { Session } from "@/lib/backend/session"
import { ValidationError } from "@/lib/error"
import { CreateItemRequest } from "@/lib/frontend/api"

export async function createItem(body: CreateItemRequest, signal?: AbortSignal): Promise<Item> {
  const session = await Session.getById(body.sessionId)

  const db = await getDb()
  const transaction = await db.transaction()

  const parent = body.parentId ? await Item.getById(body.parentId) : null

  session.options = body.options
  session.presetId = body.presetId
  await session.save()

  let item: Item
  if (body.role == 'user') {
    if (parent && parent.role === 'user') {
      throw new ValidationError('Role must be "model"')
    }

    // Create the item
    item = await Item.create({
      sessionId: session.id,
      parentId: parent?.id,
      content: body.content,
      role: 'user',
    })
  } else {
    // body.role === 'model'
    if (!parent || parent.role === 'model') {
      throw new ValidationError('Role must be "user"')
    }

    // Generate a response
    const options = body.options.modelOptions
    const integration = await Integration.getById(options.integration)
    const api = new ApiConnector(integration)
    item = await api.generate(parent, transaction, signal)
  }

  session.latestItemId = item.id
  await session.save({ transaction })

  await transaction.commit()

  return item
}
