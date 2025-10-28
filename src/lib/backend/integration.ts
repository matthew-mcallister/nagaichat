import { cached, Cached } from '@/lib/backend/cache'
import getDb from '@/lib/backend/database'
import { ApiConnector } from '@/lib/backend/integrations/interface'
import { NoSuchResource } from '@/lib/error'
import {
  Integration as ApiIntegration,
  Interface,
  ModelInfo,
  UpdateIntegrationRequest,
} from '@/lib/frontend/api'
import { DataTypes, Model, Transaction } from 'sequelize'

export class Integration extends Model {
  declare id: number
  declare name: string
  declare interface: Interface
  declare apiKey: string
  declare baseUrl: string | null
  declare createdAt: Date
  declare updatedAt: Date

  /// Returns an array of all integrations.
  public static async getAll(): Promise<Integration[]> {
    return this.findAll()
  }

  /// Looks up an integration by ID.
  public static async getById(
    id: number,
    transaction?: Transaction,
  ): Promise<Integration> {
    const integration = await this.findByPk(id, { transaction })
    if (!integration) {
      throw new NoSuchResource(`No such integration: ${id}`)
    }
    return integration
  }

  /// Clears any cache keys related to this integration
  private clearCache() {
    Integration.listModels.clear(this.id)
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

  private static listModels: Cached<[number], ModelInfo[]> = cached(
    24 * 3600,
    async (integrationId: number) => {
      const integration = await Integration.getById(integrationId)

      const api = new ApiConnector(integration)
      return api.listModels()
    },
  )

  public async models(): Promise<ModelInfo[]> {
    return Integration.listModels(this.id)
  }

  public toApiJson(): ApiIntegration {
    return {
      id: this.id,
      name: this.name,
      interface: this.interface,
      baseUrl: this.baseUrl || null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}

Integration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    interface: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    baseUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: await getDb(),
    modelName: 'Integration',
    tableName: 'integrations',
    timestamps: true,
  },
)
