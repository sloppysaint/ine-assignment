import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'

export class User extends Model {
  public id!: string
  public name!: string
  public email!: string
  public passwordHash!: string
  public role!: string
  public createdAt!: Date
  public updatedAt!: Date
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USER'
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  underscored: true,
  freezeTableName: true
})