import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'
import { User } from './user'

export class Auction extends Model {
  public id!: string
  public sellerId!: string
  public title!: string
  public description!: string
  public startingPrice!: number
  public bidIncrement!: number
  public goLiveAt!: Date
  public durationMinutes!: number
  public status!: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CLOSED'
  public createdAt!: Date
  public updatedAt!: Date
}

Auction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'seller_id',
    references: {
      model: User,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  startingPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'starting_price'
  },
  bidIncrement: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'bid_increment'
  },
  goLiveAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'go_live_at'
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration_minutes'
  },
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'LIVE', 'ENDED', 'CLOSED'),
    allowNull: false,
    defaultValue: 'SCHEDULED'
  }
}, {
  sequelize,
  modelName: 'Auction',
  tableName: 'auctions',
  underscored: true,
  freezeTableName: true
})

// Associations
Auction.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' })
User.hasMany(Auction, { foreignKey: 'sellerId', as: 'auctions' })