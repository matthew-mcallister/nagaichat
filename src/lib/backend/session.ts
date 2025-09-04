import { NoSuchResource, ValidationError } from '@/lib/error'
import getDb from '@/lib/backend/database'
import { DataTypes, Model } from 'sequelize'
import { Session as ApiSession, Content, ContentObject, CreateSessionRequest, SessionOptions } from '@/lib/frontend/api'
import { Item } from '@/lib/backend/item'
import { Preset } from '@/lib/backend/preset'

function convertContents(content: Content | Content[]): ContentObject[] {
  if (!Array.isArray(content)) {
    content = [content]
  }
  const contents: ContentObject[] = content.map(c => {
    if (typeof c === 'string') {
      return { type: 'text', text: c }
    } else {
      return c
    }
  })
  let numText = 0
  for (const c of contents) {
    if (c.type === 'text') {
      numText++
    }
    if (numText > 1) {
      throw new ValidationError('Request content contains multiple text components')
    }
  }
  return contents
}

export class Session extends Model {
  declare id: number
  /** Name pulled from first message content. */
  declare name: string
  declare presetId?: number
  declare preset?: Preset
  declare options: SessionOptions
  // TODO: Make a foreign key
  declare latestItemId?: number
  declare latestItem?: Item
  declare createdAt: Date
  // XXX: Touch updatedAt when posting a message to chat?
  declare updatedAt: Date

  public static async doCreate(body: CreateSessionRequest): Promise<Session> {
    let contents = convertContents(body.initialContent)

    // Extract name from first content item
    let name = 'New Chat'
    if (contents.length > 0) {
      const firstContent = contents[0]
      if (firstContent.type == 'text') {
        const text = firstContent.text
        name = text.slice(0, 40)
      }
    }

    const db = await getDb()
    const transaction = await db.transaction()

    const session = await this.create({
      name,
      presetId: body.presetId,
      options: body.options,
    }, { transaction })
    const item = await Item.create({
      sessionId: session.id,
      content: contents,
      role: 'user'
    }, { transaction })

    await transaction.commit()

    return session
  }

  public static async getAll(): Promise<Session[]> {
    return await Session.findAll({
      order: [['createdAt', 'DESC']]
    })
  }

  public static async getById(id: number): Promise<Session> {
    const session = await this.findByPk(id)
    if (!session) {
      throw new NoSuchResource(`No such session: ${id}`)
    }
    return session
  }

  public toApiJson(): ApiSession {
    return {
      id: this.id,
      name: this.name,
      presetId: this.presetId,
      options: this.options,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }
}

Session.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  presetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Preset,
      key: 'id',
    },
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const v = this.getDataValue('options')
      return typeof v === 'string' ? JSON.parse(v) : v
    },
  },
  latestItemId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Item,
      key: 'id',
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize: await getDb(),
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: true
})
Session.hasOne(Preset, { as: 'preset', foreignKey: 'id', sourceKey: 'presetId' })
Session.hasMany(Item, { as: 'items', foreignKey: 'sessionId' })
Session.hasOne(Item, { as: 'latestItem', sourceKey: 'latestItemId' })
Item.belongsTo(Session, { as: 'session', foreignKey: 'sessionId' })
