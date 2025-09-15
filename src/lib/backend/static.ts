import crypto from 'node:crypto'
import fs from 'node:fs'
import { NoSuchResource, ValidationError } from '@/lib/error'
import getDb from '@/lib/backend/database'
import { DataTypes, Model, Transaction } from 'sequelize'

export const UPLOAD_DIR: string = `${process.cwd()}/public/content`
export const STATIC_URL: string = `${process.env.BASE_URL || ''}/static`

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

async function storeContent(filename: string, content: Buffer): Promise<void> {
  const filepath = `${UPLOAD_DIR}/${filename}`
  await fs.promises.writeFile(filepath, content as Uint8Array, { flag: 'w' })
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

  public static async doCreate(info: StaticContentCreateInfo): Promise<StaticContent> {
    const content = makeBuffer(info.content)
    const extension = mimeToExtension(info.mimeType)

    const hasher = crypto.createHash('sha1')
    hasher.update(content as Uint8Array)
    const sha1 = hasher.digest('hex')

    const statcon = await StaticContent.create({
      mimeType: info.mimeType,
      sha1Hex: sha1,
    })
    // If this fails, the created file will just lie around as garbage
    storeContent(statcon.filename(), content)

    return statcon
  }

  /// Looks up an integration by ID.
  public static async getById(id: number): Promise<StaticContent> {
    const content = await this.findByPk(id)
    if (!content) {
      throw new NoSuchResource(`No static content with ID: ${id}`)
    }
    return content
  }

  public filename(): string {
    return `${this.sha1Hex}.${mimeToExtension(this.mimeType)}`
  }

  public url(): string {
    return `${STATIC_URL}/user/${this.filename}`
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
  modelName: 'Integration',
  tableName: 'integrations',
  timestamps: true
})
