import { DataTypes, Model } from 'sequelize'
import { SessionOptions, Preset as ApiPreset } from '@/lib/frontend/api'
import getDb from '@/lib/backend/database'
import { NoSuchResource } from '@/lib/error'

/**
 * Saved session option options.
 */
export class Preset extends Model {
  declare id: number
  declare name: string
  declare options: SessionOptions
  declare createdAt: Date
  declare updatedAt: Date

  public static async getById(id: number): Promise<Preset> {
    const result = await this.findByPk(id)
    if (!result) {
      throw new NoSuchResource(`No such preset: ${id}`)
    }
    return result
  }

  public toApiJson(): ApiPreset {
    return {
      id: this.id,
      name: this.name,
      options: this.options,
    }
  }
}

Preset.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, {
  sequelize: await getDb(),
  modelName: 'Preset',
  tableName: 'presets',
  timestamps: true
})
