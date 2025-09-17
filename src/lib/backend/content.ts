import { StaticContent } from '@/lib/backend/static'
import { Content as ApiContent } from '@/lib/frontend/api'
import { DataTypes, Model, Transaction } from "sequelize"
import type { Item } from '@/lib/backend/item'
import getDb from '@/lib/backend/database'

export class TextContent {
  public text: string

  constructor(text: string) {
    this.text = text
  }

  public toApiJson(): ApiContent {
    return { type: 'text', text: this.text } as ApiContent
  }
}

type ContentInner = TextContent | StaticContent
type ContentType = 'text' | 'static'

export class Content extends Model {
  declare id: number
  declare itemId: number
  declare item?: Item
  declare readonly getItem: () => Promise<Item>
  declare type: ContentType
  declare text: string | null
  declare staticContentId: number | null
  declare staticContent: StaticContent
  declare createdAt: Date
  declare updatedAt: Date

  public inner(): ContentInner {
    switch (this.type) {
      case 'text': return new TextContent(this.text || '')
      case 'static': return this.staticContent
    }
  }

  /**
   * Loads or creates a new content object with data received from the
   * frontend.
   */
  public static async createFromApiJson(
    item: Item,
    content: ApiContent,
    transaction: Transaction,
  ): Promise<Content> {
    switch (content.type) {
      case 'text':
        return Content.create({
          itemId: item.id,
          type: 'text',
          text: content.text,
        }, { transaction })
      case 'inline': {
        const statcon = await StaticContent.doCreate({
          mimeType: content.mimeType,
          content: content.data,
          transaction,
        })
        return Content.create({
          itemId: item.id,
          type: 'static',
          staticContentId: statcon.id,
        }, { transaction })
      }
      case 'static': {
        return Content.create({
          itemId: item.id,
          type: 'static',
          staticContentId: content.id,
        }, { transaction })
      }
    }
  }

  public toApiJson(): ApiContent {
    return this.inner().toApiJson()
  }
}

Content.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Item',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  text: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  staticContentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'StaticContent',
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
  modelName: 'Content',
  tableName: 'contents',
  timestamps: true
})
Content.belongsTo(StaticContent, { as: 'staticContent', foreignKey: 'staticContentId' })