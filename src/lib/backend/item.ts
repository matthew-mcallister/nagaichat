import { NoSuchResource } from '@/lib/error'
import getDb from '@/lib/backend/database'
import { DataTypes, Model } from 'sequelize'
import { Item as ApiItem, ContentObject, Role } from '@/lib/frontend/api'
import { Session } from '@/lib/backend/session'

export class Item extends Model {
  declare id: number
  declare sessionId: number
  declare session: Session
  declare parentId?: number
  declare parent?: Item
  declare content: ContentObject[]
  declare role: Role
  declare createdAt: Date
  declare updatedAt: Date

  public static async getAll(): Promise<Item[]> {
    return await Item.findAll({
      order: [['createdAt', 'DESC']]
    })
  }

  public static async getById(id: number): Promise<Item> {
    const session = await this.findByPk(id)
    if (!session) {
      throw new NoSuchResource(`No such item: ${id}`)
    }
    return session
  }

  public toApiJson(): ApiItem {
    return {
      id: this.id,
      sessionId: this.sessionId,
      parentId: this.parentId,
      content: this.content,
      role: this.role,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }
}

Item.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Session',
      key: 'id',
    },
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Item',
      key: 'id',
    },
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'model'),
    allowNull: false,
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
  modelName: 'Item',
  tableName: 'items',
  timestamps: true
})
Item.belongsTo(Item, { as: 'parent', foreignKey: 'parentId' })
