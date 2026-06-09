import { Content } from '@/lib/backend/content'
import getDb from '@/lib/backend/database'
import { StaticContent } from '@/lib/backend/static'
import { NoSuchResource } from '@/lib/error'
import {
  Content as ApiContent,
  Item as ApiItem,
  Role,
} from '@/lib/frontend/shared'
import { DataTypes, Model, Transaction } from 'sequelize'

interface ItemCreateInfo {
  sessionId: number
  parentId?: number | null
  role: Role
  transaction: Transaction
  content: ApiContent[]
}

export class Item extends Model {
  declare id: number
  declare sessionId: number
  declare parentId: number | null
  declare content: Content[]
  declare role: Role
  declare createdAt: Date
  declare updatedAt: Date

  private static INCLUDE_CLAUSE: any = [
    {
      model: Content,
      as: 'content',
      include: [
        {
          model: StaticContent,
          as: 'staticContent',
        },
      ],
      order: [[{ model: Content, as: 'content' }, 'id', 'ASC']],
    },
  ]

  public static async doCreate({
    sessionId,
    parentId,
    role,
    transaction,
    content,
  }: ItemCreateInfo): Promise<Item> {
    const item = await Item.create(
      {
        sessionId,
        parentId,
        role,
      },
      { transaction },
    )
    for (const c of content) {
      await Content.createFromApiJson(item, c, transaction)
    }
    await item.reload({
      transaction,
      include: this.INCLUDE_CLAUSE,
    })
    return item
  }

  public static async getBySession(sessionId: number): Promise<Item[]> {
    return await Item.findAll({
      where: { sessionId },
      include: this.INCLUDE_CLAUSE,
    })
  }

  public static async getById(
    id: number,
    transaction?: Transaction,
  ): Promise<Item> {
    const session = await this.findByPk(id, {
      include: this.INCLUDE_CLAUSE,
      transaction,
    })
    if (!session) {
      throw new NoSuchResource(`No such item: ${id}`)
    }
    return session
  }

  public async doReload(transaction: Transaction): Promise<void> {
    await this.reload({
      include: [
        {
          model: Content,
          as: 'content',
          include: [
            {
              model: StaticContent,
              as: 'staticContent',
            },
          ],
        },
      ],
      transaction,
    })
  }

  public async updateContent(
    contents: ApiContent[],
    transaction?: Transaction,
  ) {
    // Delete old content
    Content.destroy({ where: { itemId: this.id }, transaction })
    // Create new content
    for (const content of contents) {
      Content.createFromApiJson(this, content, transaction)
    }
  }

  public toApiJson(): ApiItem {
    // TODO maybe: compute, cache, and serve word count for each item
    return {
      id: this.id,
      sessionId: this.sessionId,
      parentId: this.parentId,
      content: this.content.map(c => c.toApiJson()),
      role: this.role,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}

Item.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
  },
  {
    sequelize: await getDb(),
    modelName: 'Item',
    tableName: 'items',
    timestamps: true,
  },
)
Item.belongsTo(Item, { as: 'parent', foreignKey: 'parentId' })
Item.hasMany(Content, { as: 'content' })
Content.belongsTo(Item, { as: 'item' })
