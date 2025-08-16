import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'
import { User } from './user'
import { Auction } from './auction'

export class CounterOffer extends Model {
  public id!: string
  public auctionId!: string
  public sellerId!: string
  public bidderId!: string
  public price!: number
  public status!: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  public createdAt!: Date
  public updatedAt!: Date
}

CounterOffer.init({
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
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'seller_id',
    references: {
      model: User,
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
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING'
  }
}, {
  sequelize,
  modelName: 'CounterOffer',
  tableName: 'counter_offers',
  underscored: true,
  freezeTableName: true
})

// Associations
CounterOffer.belongsTo(Auction, { foreignKey: 'auctionId', as: 'auction' })
CounterOffer.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' })
CounterOffer.belongsTo(User, { foreignKey: 'bidderId', as: 'bidder' })