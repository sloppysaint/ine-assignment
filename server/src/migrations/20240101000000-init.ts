import { QueryInterface, DataTypes } from 'sequelize'

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Users table
    await queryInterface.createTable('users', {
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
        unique: true
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USER'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })

    // Auctions table
    await queryInterface.createTable('auctions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      seller_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
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
      starting_price: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      bid_increment: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      go_live_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('SCHEDULED', 'LIVE', 'ENDED', 'CLOSED'),
        allowNull: false,
        defaultValue: 'SCHEDULED'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })

    // Bids table
    await queryInterface.createTable('bids', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      auction_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'auctions',
          key: 'id'
        }
      },
      bidder_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })

    // Notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })

    /// Counter offers table
    await queryInterface.createTable('counter_offers', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      auction_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'auctions',
          key: 'id'
        }
      },
      seller_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      bidder_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })

    // Indexes
    await queryInterface.addIndex('auctions', ['seller_id'])
    await queryInterface.addIndex('auctions', ['status'])
    await queryInterface.addIndex('auctions', ['go_live_at'])
    await queryInterface.addIndex('bids', ['auction_id'])
    await queryInterface.addIndex('bids', ['bidder_id'])
    await queryInterface.addIndex('notifications', ['user_id'])
    await queryInterface.addIndex('counter_offers', ['auction_id'])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('counter_offers')
    await queryInterface.dropTable('notifications')
    await queryInterface.dropTable('bids')
    await queryInterface.dropTable('auctions')
    await queryInterface.dropTable('users')
  }
}