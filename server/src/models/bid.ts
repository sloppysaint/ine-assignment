import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'
import { User } from './user'
import { Auction } from './auction'

export class Bid extends Model {
  public id!: string
  public auctionId!: string
  public bidderId!: string
  public amount!: number
  public createdAt!: Date
}

Bid.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  auctionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'auction_id',
    references: {
      model: Auction,
      key: 'id'
    }
  },
  bidderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'bidder_id',
    references: {
      model: User,
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Bid',
  tableName: 'bids',
  underscored: true,
  freezeTableName: true,
  updatedAt: false
})

// Associations
Bid.belongsTo(Auction, { foreignKey: 'auctionId', as: 'auction' })
Bid.belongsTo(User, { foreignKey: 'bidderId', as: 'bidder' })
Auction.hasMany(Bid, { foreignKey: 'auctionId', as: 'bids' })
User.hasMany(Bid, { foreignKey: 'bidderId', as: 'bids' })