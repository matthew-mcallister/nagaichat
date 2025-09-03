import { NoSuchResource, ValidationError } from '@/lib/error'
import getDb from '@/lib/backend/database'
import { DataTypes, Model } from 'sequelize'
import { Session as ApiSession, Content, ContentObject, CreateSessionRequest, SessionOptions } from '@/lib/frontend/api'

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
  declare options: SessionOptions
  // TODO: Make a foreign key
  declare latestItem?: number
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
        if (text.length > 50) {
          name = text.slice(0, 47) + '...'
        } else {
          name = text
        }
      }
    }

    return await this.create({
      name,
      presetId: body.presetId,
      options: body.options,
    })
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
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const v = this.getDataValue('options')
      return typeof v === 'string' ? JSON.parse(v) : v
    },
  },
  latestItem: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize: await getDb(),
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: true
})
