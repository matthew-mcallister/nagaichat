import crypto from 'node:crypto'
import fs from 'node:fs'
import { NoSuchResource, ValidationError } from '@/lib/error'
import getDb from '@/lib/backend/database'
import { DataTypes, Model, Transaction } from 'sequelize'
import { Content as ApiContent } from '@/lib/frontend/api'

export const UPLOAD_DIR: string = `${process.cwd()}/public/content`
export const STATIC_CONTENT_URL: string = `${process.env.BASE_URL || ''}/static/content`

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

interface StaticContentCreateInfo {
  mimeType: string
  content: string | Buffer
  transaction: Transaction
}

function makeBuffer(data: string | Buffer): Buffer {
  if (Buffer.isBuffer(data)) {
    return data
  } else {
    return Buffer.from(data, 'base64')
  }
}

function mimeToExtension(mime: string): string {
  switch (mime) {
    case 'image/png': return 'png'
    case 'image/jpeg': return 'jpg'
    default: throw new ValidationError(`Unsupported mime type: ${mime}`)
  }
}

async function storeContent(object: StaticContent, content: Buffer): Promise<void> {
  await fs.promises.writeFile(object.filepath(), content as Uint8Array, { flag: 'w' })
}

/**
 * Tracks static content uploads (from users) and downloads (from models). The
 * media itself is served by next.js from the `public/user` folder.
 */
// TODO maybe: Garbage collection of saved files that are no longer referenced
// in any sessions. Hard to do concurrently with serving requests but maybe it
// can be an admin tool.
export class StaticContent extends Model {
  declare id: number
  declare mimeType: string
  declare sha1Hex: string
  declare createdAt: Date
  declare updatedAt: Date

  // TODO: Persistent cache
  private _data: Buffer | null = null

  public static async doCreate(info: StaticContentCreateInfo): Promise<StaticContent> {
    const content = makeBuffer(info.content)

    const hasher = crypto.createHash('sha1')
    hasher.update(content as Uint8Array)
    const sha1 = hasher.digest('hex')

    // First try to look up existing static content
    try {
      return await this.getBySha1(sha1, info.transaction)
    } catch (e) {
      if (!(e instanceof NoSuchResource)) {
        throw e
      }
    }

    const statcon = await StaticContent.create({
      mimeType: info.mimeType,
      sha1Hex: sha1,
    })
    // If this fails, the created file will just lie around as garbage
    storeContent(statcon, content)

    return statcon
  }

  /** Looks up static content by ID. */
  public static async getById(id: number, transaction?: Transaction): Promise<StaticContent> {
    const content = await this.findByPk(id, { transaction })
    if (!content) {
      throw new NoSuchResource(`No static content with ID: ${id}`)
    }
    return content
  }

  /** Looks up static content by hash. */
  public static async getBySha1(sha1: string, transaction?: Transaction): Promise<StaticContent> {
    const content = await this.findOne({ where: { sha1Hex: sha1 }, transaction })
    if (!content) {
      throw new NoSuchResource(`No static content with hash: ${sha1}`)
    }
    return content
  }

  public filename(): string {
    return `${this.sha1Hex}.${mimeToExtension(this.mimeType)}`
  }

  public filepath(): string {
    return `${UPLOAD_DIR}/${this.filename()}`
  }

  public url(): string {
    return `${STATIC_CONTENT_URL}/${this.filename()}`
  }

  public async read(): Promise<Buffer> {
    return await fs.promises.readFile(this.filepath()) as Buffer
  }

  public toApiJson(): ApiContent {
    return { type: 'static', id: this.id, url: this.url() } as ApiContent
  }
}

StaticContent.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sha1Hex: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize: await getDb(),
  modelName: 'StaticContents',
  tableName: 'staticContents',
  timestamps: true
})
