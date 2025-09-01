import { cached, Cached } from '@/lib/backend/cache'
import { NoSuchResource } from '@/lib/error'
import { getApi, ModelInfo } from '@/lib/integrations/interface'
import getDb from '@/lib/backend/database'
import { DataTypes, Model } from 'sequelize'
import { UpdateIntegrationRequest, Integration as ApiIntegration } from '@/lib/frontend/api'

export class Integration extends Model {
  declare id: number
  declare name: string
  declare interface: 'openai' | 'gemini'
  declare apiKey: string
  declare baseUrl?: string
  declare createdAt: Date
  declare updatedAt: Date

  /// Returns an array of all integrations.
  public static async getAll(): Promise<Integration[]> {
    return this.findAll()
  }

  /// Looks up an integration by ID.
  public static async getById(id: number): Promise<Integration> {
    const integration = await this.findOne({ where: { id } })
    if (!integration) {
      throw new NoSuchResource(`No such integration: ${id}`)
    }
    return integration
  }

  /// Clears any cache keys related to this integration
  private clearCache() {
    Integration.getModels.clear(this.id)
  }

  /// Updates and returns an existing integration.
  public async doUpdate(data: UpdateIntegrationRequest): Promise<void> {
    Object.assign(this, data)
    await this.save()
    this.clearCache()
  }

  /// Deletes an existing integration. Returns `true` if a row was successfully
  /// deleted.
  public async destroy(): Promise<void> {
    await super.destroy()
    this.clearCache()
  }

  private static getModels: Cached<[number], ModelInfo[]> = cached(24 * 3600, async (integrationId: number) => {
    const integration = await Integration.getById(integrationId)

    const api = getApi(integration)
    return api.getModels()
  })

  public async models(): Promise<ModelInfo[]> {
    return Integration.getModels(this.id)
  }

  public toApiJson(): ApiIntegration {
    return {
      id: this.id,
      name: this.name,
      interface: this.interface,
      baseUrl: this.baseUrl,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}

Integration.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  interface: {
    type: DataTypes.ENUM('openai', 'gemini'),
    allowNull: false
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  baseUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize: await getDb(),
  modelName: 'Integration',
  tableName: 'integrations',
  timestamps: true
})
